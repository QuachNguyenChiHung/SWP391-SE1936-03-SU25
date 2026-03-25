using System.Text.Json;
using AutoMapper;
using DataLabeling.Application.DTOs.Comments;
using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Tasks;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces;

namespace DataLabeling.Application.Services;

/// <summary>
/// Service for annotation task operations.
/// </summary>
public class TaskService : ITaskService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IActivityLogService _activityLogService;

    public TaskService(IUnitOfWork unitOfWork, IMapper mapper, IActivityLogService activityLogService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _activityLogService = activityLogService;
    }

    public async Task<TaskAssignmentResultDto> CreateTaskAsync(
        CreateTaskRequest request,
        int assignedById,
        CancellationToken cancellationToken = default)
    {
        // Validate project exists
        var project = await _unitOfWork.Projects.GetByIdAsync(request.ProjectId, cancellationToken);
        if (project == null)
            throw new NotFoundException("Project", request.ProjectId);

        // Validate task deadline does not exceed project deadline
        if (project.Deadline.HasValue)
        {
            // Compare dates only - Project uses DateOnly, Task uses DateTime
            var taskDeadlineDate = DateOnly.FromDateTime(request.Deadline);
            var projectDeadlineDate = project.Deadline.Value;
            
            if (taskDeadlineDate > projectDeadlineDate)
            {
                throw new ValidationException($"Task deadline ({taskDeadlineDate:yyyy-MM-dd}) cannot exceed project deadline ({projectDeadlineDate:yyyy-MM-dd})");
            }
        }
        
        // Validate deadline is not in the past
        var deadlineDate = DateOnly.FromDateTime(request.Deadline);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        
        if (deadlineDate < today)
        {
            throw new ValidationException($"Task deadline cannot be in the past. Please select today or a future date.");
        }

        // Validate annotator exists and has correct role
        var annotator = await _unitOfWork.Users.GetByIdAsync(request.AnnotatorId, cancellationToken);
        if (annotator == null)
            throw new NotFoundException("Annotator", request.AnnotatorId);

        if (annotator.Role != UserRole.Annotator)
            throw new ValidationException("Selected user is not an annotator");

        if (annotator.Status != UserStatus.Active)
            throw new ValidationException("Selected annotator is not active");

        // Validate reviewer exists and has correct role
        var reviewer = await _unitOfWork.Users.GetByIdAsync(request.ReviewerId, cancellationToken);
        if (reviewer == null)
            throw new NotFoundException("Reviewer", request.ReviewerId);

        if (reviewer.Role != UserRole.Reviewer)
            throw new ValidationException("Selected user is not a reviewer");

        if (reviewer.Status != UserStatus.Active)
            throw new ValidationException("Selected reviewer is not active");

        // Prevent assigning to the reviewer with highest workload (if multiple reviewers exist)
        var allReviewers = await _unitOfWork.Users.GetByRoleAsync(UserRole.Reviewer, cancellationToken);
        var activeReviewers = allReviewers.Where(r => r.Status == UserStatus.Active).ToList();
        
        if (activeReviewers.Count > 1)
        {
            // Calculate workload for all reviewers (count assigned active tasks)
            var reviewerWorkloads = new Dictionary<int, int>();
            
            foreach (var rev in activeReviewers)
            {
                // Count tasks assigned to this reviewer that are not completed
                var assignedTasksCount = await _unitOfWork.AnnotationTasks.CountByReviewerExcludingProjectAsync(rev.Id, null, cancellationToken);
                reviewerWorkloads[rev.Id] = assignedTasksCount;
            }
            
            // Find the maximum and minimum workload
            var maxReviewerWorkload = reviewerWorkloads.Values.Max();
            var minReviewerWorkload = reviewerWorkloads.Values.Min();
            
            // Only prevent assignment if:
            // 1. Selected reviewer has the highest workload
            // 2. AND there are reviewers with STRICTLY LOWER workload (not all reviewers have the same workload)
            var hasStrictlyLowerWorkloadReviewers = minReviewerWorkload < maxReviewerWorkload;
            
            if (hasStrictlyLowerWorkloadReviewers && reviewerWorkloads[request.ReviewerId] >= maxReviewerWorkload && maxReviewerWorkload > 0)
            {
                // Find reviewers with less workload
                var lessLoadedReviewers = reviewerWorkloads
                    .Where(kvp => kvp.Value < maxReviewerWorkload)
                    .Select(kvp => activeReviewers.First(r => r.Id == kvp.Key).Name)
                    .ToList();
                
                throw new ValidationException($"Cannot assign to reviewer {reviewer.Name}. They have the highest total workload ({maxReviewerWorkload} total tasks globally). Please assign to reviewers with fewer tasks: {string.Join(", ", lessLoadedReviewers)}");
            }
        }

        // Validate annotator workload limit (maximum 100 active task items)
        const int MAX_ACTIVE_TASK_ITEMS = 100;
        var annotatorTasks = await _unitOfWork.AnnotationTasks.GetByAnnotatorIdAsync(request.AnnotatorId, cancellationToken);
        
        // Count total active task items (not completed)
        var activeTaskItemCount = 0;
        foreach (var existingTask in annotatorTasks.Where(t => t.Status != AnnotationTaskStatus.Completed))
        {
            var taskWithItems = await _unitOfWork.AnnotationTasks.GetWithTaskItemsAsync(existingTask.Id, cancellationToken);
            if (taskWithItems != null)
            {
                activeTaskItemCount += taskWithItems.TaskItems.Count(ti => ti.Status != TaskItemStatus.Completed);
            }
        }
        
        // Check if adding new items would exceed limit
        var newItemCount = request.DataItemIds?.Length ?? 0;
        if (activeTaskItemCount + newItemCount > MAX_ACTIVE_TASK_ITEMS)
        {
            throw new ValidationException($"Cannot assign {newItemCount} items to {annotator.Name}. They have {activeTaskItemCount} active items and the maximum limit is {MAX_ACTIVE_TASK_ITEMS}.");
        }
        
        // Prevent assigning to the annotator with highest workload (if multiple annotators exist)
        var allAnnotators = await _unitOfWork.Users.GetByRoleAsync(UserRole.Annotator, cancellationToken);
        var activeAnnotators = allAnnotators.Where(a => a.Status == UserStatus.Active).ToList();
        
        if (activeAnnotators.Count > 1)
        {
            // Calculate workload for all annotators
            var annotatorWorkloads = new Dictionary<int, int>();
            
            foreach (var ann in activeAnnotators)
            {
                var tasks = await _unitOfWork.AnnotationTasks.GetByAnnotatorIdAsync(ann.Id, cancellationToken);
                var itemCount = 0;
                
                foreach (var annotatorTask in tasks.Where(t => t.Status != AnnotationTaskStatus.Completed))
                {
                    var taskWithItems = await _unitOfWork.AnnotationTasks.GetWithTaskItemsAsync(annotatorTask.Id, cancellationToken);
                    if (taskWithItems != null)
                    {
                        itemCount += taskWithItems.TaskItems.Count(ti => ti.Status != TaskItemStatus.Completed);
                    }
                }
                
                annotatorWorkloads[ann.Id] = itemCount;
            }
            
            // Find the maximum and minimum workload
            var maxWorkload = annotatorWorkloads.Values.Max();
            var minWorkload = annotatorWorkloads.Values.Min();
            
            // Only prevent assignment if:
            // 1. Selected annotator has the highest workload
            // 2. AND there are annotators with STRICTLY LOWER workload (not all annotators have the same workload)
            var hasStrictlyLowerWorkloadAnnotators = minWorkload < maxWorkload;
            
            if (hasStrictlyLowerWorkloadAnnotators && annotatorWorkloads[request.AnnotatorId] >= maxWorkload && maxWorkload > 0)
            {
                // Find annotators with less workload
                var lessLoadedAnnotators = annotatorWorkloads
                    .Where(kvp => kvp.Value < maxWorkload)
                    .Select(kvp => activeAnnotators.First(a => a.Id == kvp.Key).Name)
                    .ToList();
                
                throw new ValidationException($"Cannot assign to {annotator.Name}. They have the highest workload ({maxWorkload} items). Please assign to annotators with fewer items: {string.Join(", ", lessLoadedAnnotators)}");
            }
        }

        // Create the task
        var task = new AnnotationTask
        {
            ProjectId = request.ProjectId,
            AnnotatorId = request.AnnotatorId,
            ReviewerId = request.ReviewerId,
            AssignedById = assignedById,
            Deadline = request.Deadline,
            Priority = request.Priority,
            Status = AnnotationTaskStatus.Assigned,
            TotalItems = 0,
            CompletedItems = 0,
            AssignedAt = DateTime.UtcNow
        };

        await _unitOfWork.AnnotationTasks.AddAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Assign items if provided
        var result = new TaskAssignmentResultDto
        {
            AssignedCount = 0,
            SkippedCount = 0,
            SkippedItems = new List<SkippedItemDto>()
        };

        if (request.DataItemIds.Length > 0)
        {
            var assignResult = await AssignItemsInternalAsync(task.Id, request.DataItemIds, cancellationToken);
            result.AssignedCount = assignResult.AssignedCount;
            result.SkippedCount = assignResult.SkippedCount;
            result.SkippedItems = assignResult.SkippedItems;
        }

        // Reload task with details
        var taskWithDetails = await _unitOfWork.AnnotationTasks.GetWithDetailsAsync(task.Id, cancellationToken);
        result.Task = MapToTaskDto(taskWithDetails!);

        // Log activity
        await _activityLogService.LogAsync(
            assignedById,
            ActivityAction.Assign,
            "AnnotationTask",
            task.Id,
            JsonSerializer.Serialize(new { projectId = request.ProjectId, annotatorId = request.AnnotatorId, itemCount = result.AssignedCount }),
            cancellationToken: cancellationToken);

        return result;
    }

    public async Task<TaskAssignmentResultDto> AssignItemsAsync(
        int taskId,
        AssignItemsRequest request,
        CancellationToken cancellationToken = default)
    {
        var task = await _unitOfWork.AnnotationTasks.GetByIdAsync(taskId, cancellationToken);
        if (task == null)
            throw new NotFoundException("Task", taskId);

        // Can only assign to tasks that are not completed
        if (task.Status == AnnotationTaskStatus.Completed)
            throw new ValidationException("Cannot assign items to a completed task");

        if (request.DataItemIds.Length == 0)
            throw new ValidationException("No items provided to assign");

        var result = await AssignItemsInternalAsync(taskId, request.DataItemIds, cancellationToken);

        // Reload task with details
        var taskWithDetails = await _unitOfWork.AnnotationTasks.GetWithDetailsAsync(taskId, cancellationToken);
        result.Task = MapToTaskDto(taskWithDetails!);

        return result;
    }

    private async Task<TaskAssignmentResultDto> AssignItemsInternalAsync(
        int taskId,
        int[] dataItemIds,
        CancellationToken cancellationToken)
    {
        var result = new TaskAssignmentResultDto
        {
            AssignedCount = 0,
            SkippedCount = 0,
            SkippedItems = new List<SkippedItemDto>()
        };

        var annotationTask = await _unitOfWork.AnnotationTasks.GetByIdAsync(taskId, cancellationToken);
        if (annotationTask == null) return result;

        // Get dataset for this project
        var dataset = await _unitOfWork.Datasets.GetByProjectIdAsync(annotationTask.ProjectId, cancellationToken);
        if (dataset == null)
        {
            result.SkippedItems.Add(new SkippedItemDto
            {
                DataItemId = 0,
                Reason = "Project has no dataset"
            });
            return result;
        }

        foreach (var dataItemId in dataItemIds)
        {
            // Check if item exists
            var dataItem = await _unitOfWork.DataItems.GetByIdAsync(dataItemId, cancellationToken);
            if (dataItem == null)
            {
                result.SkippedCount++;
                result.SkippedItems.Add(new SkippedItemDto
                {
                    DataItemId = dataItemId,
                    Reason = "Data item not found"
                });
                continue;
            }

            // Check if item belongs to the project's dataset
            if (dataItem.DatasetId != dataset.Id)
            {
                result.SkippedCount++;
                result.SkippedItems.Add(new SkippedItemDto
                {
                    DataItemId = dataItemId,
                    Reason = "Data item does not belong to this project"
                });
                continue;
            }

            // Check if item is already assigned (not Pending)
            if (dataItem.Status != DataItemStatus.Pending)
            {
                result.SkippedCount++;
                result.SkippedItems.Add(new SkippedItemDto
                {
                    DataItemId = dataItemId,
                    Reason = $"Data item already has status: {dataItem.Status}"
                });
                continue;
            }

            // Check if item is already in this task
            if (await _unitOfWork.TaskItems.IsDataItemInTaskAsync(taskId, dataItemId, cancellationToken))
            {
                result.SkippedCount++;
                result.SkippedItems.Add(new SkippedItemDto
                {
                    DataItemId = dataItemId,
                    Reason = "Data item is already in this task"
                });
                continue;
            }

            // Create task item
            var taskItem = new TaskItem
            {
                TaskId = taskId,
                DataItemId = dataItemId,
                Status = TaskItemStatus.Assigned,
                AssignedAt = DateTime.UtcNow
            };

            await _unitOfWork.TaskItems.AddAsync(taskItem, cancellationToken);

            // Update data item status
            dataItem.Status = DataItemStatus.Assigned;
            dataItem.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.DataItems.Update(dataItem);

            result.AssignedCount++;
        }

        // Save changes
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Update task progress
        await _unitOfWork.AnnotationTasks.UpdateProgressAsync(taskId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return result;
    }

    public async Task<int> RemoveItemsAsync(
        int taskId,
        int[] dataItemIds,
        CancellationToken cancellationToken = default)
    {
        var task = await _unitOfWork.AnnotationTasks.GetWithTaskItemsAsync(taskId, cancellationToken);
        if (task == null)
            throw new NotFoundException("Task", taskId);

        // Can only remove items from assigned tasks (not started)
        if (task.Status != AnnotationTaskStatus.Assigned)
            throw new ValidationException("Cannot remove items from a task that has already started");

        int removedCount = 0;

        foreach (var dataItemId in dataItemIds)
        {
            var taskItem = task.TaskItems.FirstOrDefault(ti => ti.DataItemId == dataItemId);
            if (taskItem == null) continue;

            // Can only remove if not started
            if (taskItem.Status != TaskItemStatus.Assigned)
                continue;

            // Reset data item status back to Pending
            var dataItem = await _unitOfWork.DataItems.GetByIdAsync(dataItemId, cancellationToken);
            if (dataItem != null)
            {
                dataItem.Status = DataItemStatus.Pending;
                dataItem.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.DataItems.Update(dataItem);
            }

            _unitOfWork.TaskItems.Delete(taskItem);
            removedCount++;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Update task progress
        await _unitOfWork.AnnotationTasks.UpdateProgressAsync(taskId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return removedCount;
    }

    public async Task DeleteTaskAsync(int taskId, int userId, CancellationToken cancellationToken = default)
    {
        var task = await _unitOfWork.AnnotationTasks.GetWithTaskItemsAsync(taskId, cancellationToken);
        if (task == null)
            throw new NotFoundException("Task", taskId);

        // Can only delete tasks that haven't been submitted/completed
        if (task.Status == AnnotationTaskStatus.Submitted || task.Status == AnnotationTaskStatus.Completed)
            throw new ValidationException("Cannot delete a task that has been submitted or completed");

        // Check if any items have been worked on
        var hasWorkedItems = task.TaskItems.Any(ti => ti.Status != TaskItemStatus.Assigned);
        if (hasWorkedItems)
            throw new ValidationException("Cannot delete a task with items that have been worked on");

        // Capture task details for logging before deletion
        var projectId = task.ProjectId;
        var annotatorId = task.AnnotatorId;
        var itemCount = task.TotalItems;

        // Reset all data item statuses back to Pending
        foreach (var taskItem in task.TaskItems)
        {
            var dataItem = await _unitOfWork.DataItems.GetByIdAsync(taskItem.DataItemId, cancellationToken);
            if (dataItem != null && dataItem.Status == DataItemStatus.Assigned)
            {
                dataItem.Status = DataItemStatus.Pending;
                dataItem.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.DataItems.Update(dataItem);
            }
        }

        // Delete task (cascade will delete task items)
        _unitOfWork.AnnotationTasks.Delete(task);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Log activity
        await _activityLogService.LogAsync(
            userId,
            ActivityAction.Delete,
            "AnnotationTask",
            taskId,
            JsonSerializer.Serialize(new { projectId, annotatorId, itemCount }),
            cancellationToken: cancellationToken);
    }

    public async Task<TaskDetailDto?> GetTaskByIdAsync(int taskId, CancellationToken cancellationToken = default)
    {
        var task = await _unitOfWork.AnnotationTasks.GetWithDetailsAsync(taskId, cancellationToken);
        if (task == null) return null;

        var items = new List<TaskItemDto>();
        foreach (var ti in task.TaskItems)
        {
            var comments = await _unitOfWork.Comments.GetCommentsByTaskItemIdAsync(ti.Id);
            var commentDtos = new List<CommentDto>();

            foreach (var comment in comments)
            {
                var author = await _unitOfWork.Users.GetByIdAsync(comment.AuthorId, cancellationToken);
                commentDtos.Add(new CommentDto
                {
                    Id = comment.Id,
                    TaskItemId = comment.TaskItemId,
                    AuthorId = comment.AuthorId,
                    AuthorName = author?.Name,
                    AuthorRole = comment.AuthorRole,
                    Content = comment.Content,
                    CreatedAt = comment.CreatedAt
                });
            }

            items.Add(new TaskItemDto
            {
                Id = ti.Id,
                DataItemId = ti.DataItemId,
                FileName = ti.DataItem?.FileName ?? "Unknown",
                FilePath = ti.DataItem?.FilePath ?? "",
                ThumbnailPath = ti.DataItem?.ThumbnailPath,
                Status = ti.Status,
                DataItemStatus = ti.DataItem?.Status ?? DataItemStatus.Pending,
                AssignedAt = ti.AssignedAt,
                StartedAt = ti.StartedAt,
                CompletedAt = ti.CompletedAt,
                Comments = commentDtos
            });
        }

        return new TaskDetailDto
        {
            Id = task.Id,
            ProjectId = task.ProjectId,
            ProjectName = task.Project?.Name ?? "Unknown",
            AnnotatorId = task.AnnotatorId,
            AnnotatorName = task.Annotator?.Name ?? "Unknown",
            AssignedById = task.AssignedById,
            AssignedByName = task.AssignedBy?.Name ?? "Unknown",
            ReviewerId = task.ReviewerId,
            ReviewerName = task.Reviewer?.Name,
            Status = task.Status,
            TotalItems = task.TotalItems,
            CompletedItems = task.CompletedItems,
            ProgressPercent = task.ProgressPercent,
            AssignedAt = task.AssignedAt,
            SubmittedAt = task.SubmittedAt,
            CompletedAt = task.CompletedAt,
            Deadline = task.Deadline,
            Priority = task.Priority,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
            Items = items
        };
    }

    public async Task<PagedResult<TaskDto>> GetTasksAsync(
        int pageNumber,
        int pageSize,
        int? projectId = null,
        int? annotatorId = null,
        AnnotationTaskStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _unitOfWork.AnnotationTasks.GetPagedAsync(
            pageNumber, pageSize, projectId, annotatorId, status, null, cancellationToken);

        return new PagedResult<TaskDto>
        {
            Items = items.Select(MapToTaskDto).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<PagedResult<UnassignedItemDto>> GetUnassignedItemsAsync(
        int projectId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
            throw new NotFoundException("Project", projectId);

        var dataset = await _unitOfWork.Datasets.GetByProjectIdAsync(projectId, cancellationToken);
        if (dataset == null)
        {
            return new PagedResult<UnassignedItemDto>
            {
                Items = new List<UnassignedItemDto>(),
                TotalCount = 0,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        // Get items with Pending status
        var (items, totalCount) = await _unitOfWork.DataItems.GetPagedAsync(
            dataset.Id, pageNumber, pageSize, DataItemStatus.Pending, null, cancellationToken);

        return new PagedResult<UnassignedItemDto>
        {
            Items = items.Select(i => new UnassignedItemDto
            {
                Id = i.Id,
                FileName = i.FileName,
                ThumbnailPath = i.ThumbnailPath,
                FileSizeKB = i.FileSizeKB,
                CreatedAt = i.CreatedAt
            }).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<IEnumerable<AnnotatorDto>> GetAvailableAnnotatorsAsync(CancellationToken cancellationToken = default)
    {
        var annotators = await _unitOfWork.Users.GetByRoleAsync(UserRole.Annotator, cancellationToken);
        var activeAnnotators = annotators.Where(a => a.Status == UserStatus.Active);

        var result = new List<AnnotatorDto>();

        foreach (var annotator in activeAnnotators)
        {
            // Count active tasks (not completed)
            var tasks = await _unitOfWork.AnnotationTasks.GetByAnnotatorIdAsync(annotator.Id, cancellationToken);
            var activeTaskCount = tasks.Count(t => t.Status != AnnotationTaskStatus.Completed);
            
            // Count active task items (not completed)
            var activeTaskItemCount = 0;
            foreach (var task in tasks.Where(t => t.Status != AnnotationTaskStatus.Completed))
            {
                var taskWithItems = await _unitOfWork.AnnotationTasks.GetWithTaskItemsAsync(task.Id, cancellationToken);
                if (taskWithItems != null)
                {
                    activeTaskItemCount += taskWithItems.TaskItems.Count(ti => ti.Status != TaskItemStatus.Completed);
                }
            }

            result.Add(new AnnotatorDto
            {
                Id = annotator.Id,
                Name = annotator.Name,
                Email = annotator.Email,
                ActiveTaskCount = activeTaskCount,
                ActiveTaskItemCount = activeTaskItemCount,
                SpecializedIn = annotator.SpecializeIn
            });
        }

        return result.OrderBy(a => a.ActiveTaskItemCount).ThenBy(a => a.Name);
    }

    public async Task<IEnumerable<ReviewerDto>> GetAvailableReviewersAsync(int? projectId = null, CancellationToken cancellationToken = default)
    {
        var reviewers = await _unitOfWork.Users.GetByRoleAsync(UserRole.Reviewer, cancellationToken);
        var activeReviewers = reviewers.Where(r => r.Status == UserStatus.Active);

        var result = new List<ReviewerDto>();
        var reviewerList = activeReviewers.ToList();

        // NOTE: intentionally avoiding a prefetch of tasks by reviewer ids because
        // the repository does not expose a GetByReviewerIdsAsync method. The
        // remaining logic only needs per-reviewer counts which are obtained
        // below without an extra repository method to prevent N+1 in larger
        // refactors where such a repository method may be added.

        foreach (var reviewer in reviewerList)
        {
            // Count assigned tasks (not completed) for workload distribution
            int activeReviewCount = 0;
            try
            {
                activeReviewCount = await _unitOfWork.AnnotationTasks.CountByReviewerExcludingProjectAsync(reviewer.Id, null, cancellationToken);
            }
            catch
            {
                // ignore and leave count as 0
            }

            // Count assigned tasks in other projects if projectId provided
            int otherProjectAssignedCount = 0;
            try
            {
                otherProjectAssignedCount = await _unitOfWork.AnnotationTasks.CountByReviewerExcludingProjectAsync(reviewer.Id, projectId, cancellationToken);
            }
            catch
            {
                // ignore and leave count as 0
            }

            result.Add(new ReviewerDto
            {
                Id = reviewer.Id,
                Name = reviewer.Name,
                Email = reviewer.Email,
                ActiveReviewCount = activeReviewCount,
                OtherProjectAssignedTaskCount = otherProjectAssignedCount,
                SpecializedIn = reviewer.SpecializeIn
            });
        }

        return result.OrderBy(r => r.ActiveReviewCount).ThenBy(r => r.Name);
    }

    public async Task AssignReviewerAsync(int taskId, int reviewerId, int assignedById, CancellationToken cancellationToken = default)
    {
        var task = await _unitOfWork.AnnotationTasks.GetByIdAsync(taskId, cancellationToken);
        if (task == null)
            throw new NotFoundException("Task", taskId);

        var reviewer = await _unitOfWork.Users.GetByIdAsync(reviewerId, cancellationToken);
        if (reviewer == null)
            throw new NotFoundException("Reviewer", reviewerId);
        if (reviewer.Role != UserRole.Reviewer)
            throw new ValidationException("Selected user is not a reviewer");
        if (reviewer.Status != UserStatus.Active)
            throw new ValidationException("Selected reviewer is not active");

        // Prevent assigning to the reviewer with highest workload (if multiple reviewers exist)
        var allReviewers = await _unitOfWork.Users.GetByRoleAsync(UserRole.Reviewer, cancellationToken);
        var activeReviewers = allReviewers.Where(r => r.Status == UserStatus.Active).ToList();
        
        if (activeReviewers.Count > 1)
        {
            // Calculate workload for all reviewers (count assigned active tasks)
            var reviewerWorkloads = new Dictionary<int, int>();
            
            foreach (var rev in activeReviewers)
            {
                // Count tasks assigned to this reviewer that are not completed
                var assignedTasksCount = await _unitOfWork.AnnotationTasks.CountByReviewerExcludingProjectAsync(rev.Id, null, cancellationToken);
                reviewerWorkloads[rev.Id] = assignedTasksCount;
            }
            
            // Find the maximum and minimum workload
            var maxReviewerWorkload = reviewerWorkloads.Values.Max();
            var minReviewerWorkload = reviewerWorkloads.Values.Min();
            
            // Only prevent assignment if:
            // 1. Selected reviewer has the highest workload
            // 2. AND there are reviewers with STRICTLY LOWER workload (not all reviewers have the same workload)
            var hasStrictlyLowerWorkloadReviewers = minReviewerWorkload < maxReviewerWorkload;
            
            if (hasStrictlyLowerWorkloadReviewers && reviewerWorkloads[reviewerId] >= maxReviewerWorkload && maxReviewerWorkload > 0)
            {
                // Find reviewers with less workload
                var lessLoadedReviewers = reviewerWorkloads
                    .Where(kvp => kvp.Value < maxReviewerWorkload)
                    .Select(kvp => activeReviewers.First(r => r.Id == kvp.Key).Name)
                    .ToList();
                
                throw new ValidationException($"Cannot assign to reviewer {reviewer.Name}. They have the highest total workload ({maxReviewerWorkload} total tasks globally). Please assign to reviewers with fewer tasks: {string.Join(", ", lessLoadedReviewers)}");
            }
        }

        task.ReviewerId = reviewerId;
        task.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.AnnotationTasks.Update(task);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _activityLogService.LogAsync(
            assignedById,
            ActivityAction.Update,
            "AnnotationTask",
            taskId,
            JsonSerializer.Serialize(new { reviewerId }),
            cancellationToken: cancellationToken);
    }

    private static TaskDto MapToTaskDto(AnnotationTask task)
    {
        return new TaskDto
        {
            Id = task.Id,
            ProjectId = task.ProjectId,
            ProjectName = task.Project?.Name ?? "Unknown",
            AnnotatorId = task.AnnotatorId,
            AnnotatorName = task.Annotator?.Name ?? "Unknown",
            ReviewerId = task.ReviewerId,
            ReviewerName = task.Reviewer?.Name,
            Status = task.Status,
            TotalItems = task.TotalItems,
            CompletedItems = task.CompletedItems,
            ProgressPercent = task.ProgressPercent,
            AssignedAt = task.AssignedAt,
            SubmittedAt = task.SubmittedAt,
            CompletedAt = task.CompletedAt,
            Deadline = task.Deadline,
            Priority = task.Priority,
            CreatedAt = task.CreatedAt
        };
    }
}
