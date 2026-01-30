using AutoMapper;
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

    public TaskService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
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

        // Validate annotator exists and has correct role
        var annotator = await _unitOfWork.Users.GetByIdAsync(request.AnnotatorId, cancellationToken);
        if (annotator == null)
            throw new NotFoundException("Annotator", request.AnnotatorId);

        if (annotator.Role != UserRole.Annotator)
            throw new ValidationException("Selected user is not an annotator");

        if (annotator.Status != UserStatus.Active)
            throw new ValidationException("Selected annotator is not active");

        // Create the task
        var task = new AnnotationTask
        {
            ProjectId = request.ProjectId,
            AnnotatorId = request.AnnotatorId,
            AssignedById = assignedById,
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

        var task = await _unitOfWork.AnnotationTasks.GetByIdAsync(taskId, cancellationToken);
        if (task == null) return result;

        // Get dataset for this project
        var dataset = await _unitOfWork.Datasets.GetByProjectIdAsync(task.ProjectId, cancellationToken);
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

    public async Task DeleteTaskAsync(int taskId, CancellationToken cancellationToken = default)
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
    }

    public async Task<TaskDetailDto?> GetTaskByIdAsync(int taskId, CancellationToken cancellationToken = default)
    {
        var task = await _unitOfWork.AnnotationTasks.GetWithDetailsAsync(taskId, cancellationToken);
        if (task == null) return null;

        return new TaskDetailDto
        {
            Id = task.Id,
            ProjectId = task.ProjectId,
            ProjectName = task.Project?.Name ?? "Unknown",
            AnnotatorId = task.AnnotatorId,
            AnnotatorName = task.Annotator?.Name ?? "Unknown",
            AssignedById = task.AssignedById,
            AssignedByName = task.AssignedBy?.Name ?? "Unknown",
            Status = task.Status,
            TotalItems = task.TotalItems,
            CompletedItems = task.CompletedItems,
            ProgressPercent = task.ProgressPercent,
            AssignedAt = task.AssignedAt,
            SubmittedAt = task.SubmittedAt,
            CompletedAt = task.CompletedAt,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
            Items = task.TaskItems.Select(ti => new TaskItemDto
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
                CompletedAt = ti.CompletedAt
            }).ToList()
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
            pageNumber, pageSize, projectId, annotatorId, status, cancellationToken);

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
            dataset.Id, pageNumber, pageSize, DataItemStatus.Pending, cancellationToken);

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

            result.Add(new AnnotatorDto
            {
                Id = annotator.Id,
                Name = annotator.Name,
                Email = annotator.Email,
                ActiveTaskCount = activeTaskCount
            });
        }

        return result.OrderBy(a => a.ActiveTaskCount).ThenBy(a => a.Name);
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
            Status = task.Status,
            TotalItems = task.TotalItems,
            CompletedItems = task.CompletedItems,
            ProgressPercent = task.ProgressPercent,
            AssignedAt = task.AssignedAt,
            SubmittedAt = task.SubmittedAt,
            CompletedAt = task.CompletedAt,
            CreatedAt = task.CreatedAt
        };
    }
}
