using System.Text.Json;
using DataLabeling.Application.DTOs.Annotations;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces;

namespace DataLabeling.Application.Services;

/// <summary>
/// Service for annotation operations.
/// </summary>
public class AnnotationService : IAnnotationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IActivityLogService _activityLogService;

    public AnnotationService(IUnitOfWork unitOfWork, IActivityLogService activityLogService)
    {
        _unitOfWork = unitOfWork;
        _activityLogService = activityLogService;
    }

    public async Task<IEnumerable<AnnotationDto>> GetByDataItemIdAsync(
        int dataItemId,
        CancellationToken cancellationToken = default)
    {
        var annotations = await _unitOfWork.Annotations.GetByDataItemIdWithLabelAsync(dataItemId, cancellationToken);
        return annotations.Select(MapToDto);
    }

    public async Task<AnnotationDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var annotation = await _unitOfWork.Annotations.GetByIdAsync(id, cancellationToken);
        if (annotation == null) return null;

        // Load related data
        var label = await _unitOfWork.Labels.GetByIdAsync(annotation.LabelId, cancellationToken);
        var creator = await _unitOfWork.Users.GetByIdAsync(annotation.CreatedById, cancellationToken);

        return new AnnotationDto
        {
            Id = annotation.Id,
            DataItemId = annotation.DataItemId,
            LabelId = annotation.LabelId,
            LabelName = label?.Name ?? "",
            LabelColor = label?.Color ?? "",
            CreatedById = annotation.CreatedById,
            CreatedByName = creator?.Name ?? "",
            Coordinates = annotation.Coordinates,
            Attributes = annotation.Attributes,
            CreatedAt = annotation.CreatedAt,
            UpdatedAt = annotation.UpdatedAt
        };
    }

    public async Task<AnnotationDto> CreateAsync(
        int dataItemId,
        CreateAnnotationRequest request,
        int createdById,
        CancellationToken cancellationToken = default)
    {
        // Validate data item exists
        var dataItem = await _unitOfWork.DataItems.GetByIdAsync(dataItemId, cancellationToken);
        if (dataItem == null)
            throw new NotFoundException("DataItem", dataItemId);

        // Validate label exists and belongs to the same project
        var label = await _unitOfWork.Labels.GetByIdAsync(request.LabelId, cancellationToken);
        if (label == null)
            throw new NotFoundException("Label", request.LabelId);

        // Get dataset to find project
        var dataset = await _unitOfWork.Datasets.GetByIdAsync(dataItem.DatasetId, cancellationToken);
        if (dataset == null || label.ProjectId != dataset.ProjectId)
            throw new ValidationException("Label does not belong to this project");

        // Create annotation
        var annotation = new Annotation
        {
            DataItemId = dataItemId,
            LabelId = request.LabelId,
            CreatedById = createdById,
            Coordinates = request.Coordinates,
            Attributes = request.Attributes
        };

        await _unitOfWork.Annotations.AddAsync(annotation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Log activity
        await _activityLogService.LogAsync(
            createdById,
            ActivityAction.Create,
            "Annotation",
            annotation.Id,
            JsonSerializer.Serialize(new { labelId = request.LabelId, dataItemId }),
            cancellationToken: cancellationToken);

        return new AnnotationDto
        {
            Id = annotation.Id,
            DataItemId = annotation.DataItemId,
            LabelId = annotation.LabelId,
            LabelName = label.Name,
            LabelColor = label.Color,
            CreatedById = annotation.CreatedById,
            CreatedByName = (await _unitOfWork.Users.GetByIdAsync(createdById, cancellationToken))?.Name ?? "",
            Coordinates = annotation.Coordinates,
            Attributes = annotation.Attributes,
            CreatedAt = annotation.CreatedAt,
            UpdatedAt = annotation.UpdatedAt
        };
    }

    public async Task<AnnotationDto> UpdateAsync(
        int id,
        UpdateAnnotationRequest request,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var annotation = await _unitOfWork.Annotations.GetByIdAsync(id, cancellationToken);
        if (annotation == null)
            throw new NotFoundException("Annotation", id);

        // Update fields if provided
        if (request.LabelId.HasValue)
        {
            var label = await _unitOfWork.Labels.GetByIdAsync(request.LabelId.Value, cancellationToken);
            if (label == null)
                throw new NotFoundException("Label", request.LabelId.Value);

            // Validate label belongs to same project
            var dataItem = await _unitOfWork.DataItems.GetByIdAsync(annotation.DataItemId, cancellationToken);
            var dataset = await _unitOfWork.Datasets.GetByIdAsync(dataItem!.DatasetId, cancellationToken);
            if (label.ProjectId != dataset!.ProjectId)
                throw new ValidationException("Label does not belong to this project");

            annotation.LabelId = request.LabelId.Value;
        }

        if (request.Coordinates != null)
            annotation.Coordinates = request.Coordinates;

        if (request.Attributes != null)
            annotation.Attributes = request.Attributes;

        annotation.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Annotations.Update(annotation);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Log activity
        await _activityLogService.LogAsync(
            userId,
            ActivityAction.Update,
            "Annotation",
            id,
            JsonSerializer.Serialize(new { labelId = request.LabelId, dataItemId = annotation.DataItemId }),
            cancellationToken: cancellationToken);

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task DeleteAsync(int id, int userId, CancellationToken cancellationToken = default)
    {
        var annotation = await _unitOfWork.Annotations.GetByIdAsync(id, cancellationToken);
        if (annotation == null)
            throw new NotFoundException("Annotation", id);

        var dataItemId = annotation.DataItemId;
        var labelId = annotation.LabelId;

        _unitOfWork.Annotations.Delete(annotation);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Log activity
        await _activityLogService.LogAsync(
            userId,
            ActivityAction.Delete,
            "Annotation",
            id,
            JsonSerializer.Serialize(new { labelId, dataItemId }),
            cancellationToken: cancellationToken);
    }

    public async Task<IEnumerable<AnnotationDto>> SaveAllAsync(
        int dataItemId,
        SaveAnnotationsRequest request,
        int createdById,
        CancellationToken cancellationToken = default)
    {
        // Validate data item exists
        var dataItem = await _unitOfWork.DataItems.GetByIdAsync(dataItemId, cancellationToken);
        if (dataItem == null)
            throw new NotFoundException("DataItem", dataItemId);

        // Get dataset to find project for label validation
        var dataset = await _unitOfWork.Datasets.GetByIdAsync(dataItem.DatasetId, cancellationToken);
        if (dataset == null)
            throw new NotFoundException("Dataset", dataItem.DatasetId);

        // Validate all labels belong to the project
        var projectLabels = await _unitOfWork.Labels.GetByProjectIdAsync(dataset.ProjectId, cancellationToken);
        var labelIds = projectLabels.Select(l => l.Id).ToHashSet();

        foreach (var item in request.Annotations)
        {
            if (!labelIds.Contains(item.LabelId))
                throw new ValidationException($"Label {item.LabelId} does not belong to this project");
        }

        // Delete existing annotations
        await _unitOfWork.Annotations.DeleteByDataItemIdAsync(dataItemId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Create new annotations
        var newAnnotations = new List<Annotation>();
        foreach (var item in request.Annotations)
        {
            var annotation = new Annotation
            {
                DataItemId = dataItemId,
                LabelId = item.LabelId,
                CreatedById = createdById,
                Coordinates = item.Coordinates,
                Attributes = item.Attributes
            };
            newAnnotations.Add(annotation);
        }

        if (newAnnotations.Any())
        {
            await _unitOfWork.Annotations.AddRangeAsync(newAnnotations, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        // Return saved annotations
        return await GetByDataItemIdAsync(dataItemId, cancellationToken);
    }

    public async Task<TaskItemProgressDto> StartWorkingAsync(
        int taskItemId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var taskItem = await _unitOfWork.TaskItems.GetWithDataItemAsync(taskItemId, cancellationToken);
        if (taskItem == null)
            throw new NotFoundException("TaskItem", taskItemId);

        // Get task to validate user is the assigned annotator
        var task = await _unitOfWork.AnnotationTasks.GetByIdAsync(taskItem.TaskId, cancellationToken);
        if (task == null)
            throw new NotFoundException("Task", taskItem.TaskId);

        if (task.AnnotatorId != userId)
            throw new ForbiddenException("You are not assigned to this task");

        // Update task item status
        if (taskItem.Status == TaskItemStatus.Assigned)
        {
            taskItem.Status = TaskItemStatus.InProgress;
            taskItem.StartedAt = DateTime.UtcNow;
            _unitOfWork.TaskItems.Update(taskItem);

            // Update data item status
            var dataItem = taskItem.DataItem ?? await _unitOfWork.DataItems.GetByIdAsync(taskItem.DataItemId, cancellationToken);
            if (dataItem != null && dataItem.Status == DataItemStatus.Assigned)
            {
                dataItem.Status = DataItemStatus.InProgress;
                dataItem.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.DataItems.Update(dataItem);
            }

            // Update task status to InProgress if it was Assigned
            if (task.Status == AnnotationTaskStatus.Assigned)
            {
                task.Status = AnnotationTaskStatus.InProgress;
                task.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.AnnotationTasks.Update(task);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return await GetTaskItemProgressDto(taskItem.TaskId, taskItemId, cancellationToken);
    }

    public async Task<TaskItemProgressDto> CompleteItemAsync(
        int taskItemId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var taskItem = await _unitOfWork.TaskItems.GetWithDataItemAsync(taskItemId, cancellationToken);
        if (taskItem == null)
            throw new NotFoundException("TaskItem", taskItemId);

        // Get task to validate user is the assigned annotator
        var task = await _unitOfWork.AnnotationTasks.GetByIdAsync(taskItem.TaskId, cancellationToken);
        if (task == null)
            throw new NotFoundException("Task", taskItem.TaskId);

        if (task.AnnotatorId != userId)
            throw new ForbiddenException("You are not assigned to this task");

        // Can only complete if in progress
        if (taskItem.Status == TaskItemStatus.Completed)
            throw new ValidationException("Task item is already completed");

        // Update task item status
        taskItem.Status = TaskItemStatus.Completed;
        taskItem.CompletedAt = DateTime.UtcNow;
        if (taskItem.StartedAt == null)
            taskItem.StartedAt = DateTime.UtcNow;
        _unitOfWork.TaskItems.Update(taskItem);

        // Update data item status
        var dataItem = taskItem.DataItem ?? await _unitOfWork.DataItems.GetByIdAsync(taskItem.DataItemId, cancellationToken);
        if (dataItem != null)
        {
            dataItem.Status = DataItemStatus.Submitted;
            dataItem.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.DataItems.Update(dataItem);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Update task progress
        await _unitOfWork.AnnotationTasks.UpdateProgressAsync(task.Id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetTaskItemProgressDto(task.Id, taskItemId, cancellationToken);
    }

    public async Task<AnnotationEditorDto?> GetAnnotationEditorDataAsync(
        int taskItemId,
        CancellationToken cancellationToken = default)
    {
        var taskItem = await _unitOfWork.TaskItems.GetWithDataItemAsync(taskItemId, cancellationToken);
        if (taskItem == null) return null;

        var dataItem = taskItem.DataItem ?? await _unitOfWork.DataItems.GetByIdAsync(taskItem.DataItemId, cancellationToken);
        if (dataItem == null) return null;

        var task = await _unitOfWork.AnnotationTasks.GetWithTaskItemsAsync(taskItem.TaskId, cancellationToken);
        if (task == null) return null;

        // Get project labels
        var labels = await _unitOfWork.Labels.GetByProjectIdAsync(task.ProjectId, cancellationToken);
        var orderedLabels = labels.OrderBy(l => l.DisplayOrder).ToList();

        // Get existing annotations
        var annotations = await GetByDataItemIdAsync(dataItem.Id, cancellationToken);

        // Calculate navigation
        var taskItems = task.TaskItems.OrderBy(ti => ti.Id).ToList();
        var currentIndex = taskItems.FindIndex(ti => ti.Id == taskItemId);
        var prevId = currentIndex > 0 ? taskItems[currentIndex - 1].Id : (int?)null;
        var nextId = currentIndex < taskItems.Count - 1 ? taskItems[currentIndex + 1].Id : (int?)null;

        return new AnnotationEditorDto
        {
            TaskItemId = taskItemId,
            TaskId = task.Id,
            DataItemId = dataItem.Id,
            FileName = dataItem.FileName,
            FilePath = dataItem.FilePath,
            Status = taskItem.Status.ToString(),
            Labels = orderedLabels.Select(l => new LabelOptionDto
            {
                Id = l.Id,
                Name = l.Name,
                Color = l.Color,
                Shortcut = l.Shortcut
            }).ToList(),
            Annotations = annotations.ToList(),
            Navigation = new NavigationDto
            {
                PreviousTaskItemId = prevId,
                NextTaskItemId = nextId,
                CurrentIndex = currentIndex + 1,
                TotalItems = taskItems.Count
            }
        };
    }

    private async Task<TaskItemProgressDto> GetTaskItemProgressDto(
        int taskId,
        int taskItemId,
        CancellationToken cancellationToken)
    {
        var task = await _unitOfWork.AnnotationTasks.GetByIdAsync(taskId, cancellationToken);
        var taskItem = await _unitOfWork.TaskItems.GetByIdAsync(taskItemId, cancellationToken);

        return new TaskItemProgressDto
        {
            TaskItemId = taskItemId,
            TaskId = taskId,
            Status = taskItem?.Status.ToString() ?? "",
            StartedAt = taskItem?.StartedAt,
            CompletedAt = taskItem?.CompletedAt,
            TaskTotalItems = task?.TotalItems ?? 0,
            TaskCompletedItems = task?.CompletedItems ?? 0,
            TaskProgressPercent = task?.ProgressPercent ?? 0
        };
    }

    private static AnnotationDto MapToDto(Annotation annotation)
    {
        return new AnnotationDto
        {
            Id = annotation.Id,
            DataItemId = annotation.DataItemId,
            LabelId = annotation.LabelId,
            LabelName = annotation.Label?.Name ?? "",
            LabelColor = annotation.Label?.Color ?? "",
            CreatedById = annotation.CreatedById,
            CreatedByName = annotation.CreatedBy?.Name ?? "",
            Coordinates = annotation.Coordinates,
            Attributes = annotation.Attributes,
            CreatedAt = annotation.CreatedAt,
            UpdatedAt = annotation.UpdatedAt
        };
    }

    // ==================== Re-annotation ====================

    public async Task<TaskItemProgressDto> StartReAnnotationAsync(
        int taskItemId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var taskItem = await _unitOfWork.TaskItems.GetWithDataItemAsync(taskItemId, cancellationToken);
        if (taskItem == null)
            throw new NotFoundException("TaskItem", taskItemId);

        // Get task to validate user is the assigned annotator
        var task = await _unitOfWork.AnnotationTasks.GetByIdAsync(taskItem.TaskId, cancellationToken);
        if (task == null)
            throw new NotFoundException("Task", taskItem.TaskId);

        if (task.AnnotatorId != userId)
            throw new ForbiddenException("You are not assigned to this task");

        // Get data item
        var dataItem = taskItem.DataItem ?? await _unitOfWork.DataItems.GetByIdAsync(taskItem.DataItemId, cancellationToken);
        if (dataItem == null)
            throw new NotFoundException("DataItem", taskItem.DataItemId);

        // Can only start re-annotation if the item was rejected
        if (dataItem.Status != DataItemStatus.Rejected)
            throw new ValidationException($"Can only re-annotate rejected items. Current status: {dataItem.Status}");

        // Reset TaskItem status to InProgress
        taskItem.Status = TaskItemStatus.InProgress;
        taskItem.CompletedAt = null; // Clear completed timestamp
        _unitOfWork.TaskItems.Update(taskItem);

        // Reset DataItem status to InProgress
        dataItem.Status = DataItemStatus.InProgress;
        dataItem.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.DataItems.Update(dataItem);

        // Reset Task status to InProgress if it was Submitted
        if (task.Status == AnnotationTaskStatus.Submitted)
        {
            task.Status = AnnotationTaskStatus.InProgress;
            task.SubmittedAt = null;
            task.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.AnnotationTasks.Update(task);
        }

        // Update task progress (decrement completed count)
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _unitOfWork.AnnotationTasks.UpdateProgressAsync(task.Id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Log activity
        await _activityLogService.LogAsync(
            userId,
            ActivityAction.Update,
            "TaskItem",
            taskItemId,
            JsonSerializer.Serialize(new { action = "StartReAnnotation", dataItemId = dataItem.Id }),
            cancellationToken: cancellationToken);

        return await GetTaskItemProgressDto(task.Id, taskItemId, cancellationToken);
    }

    public async Task<IEnumerable<RejectedItemDto>> GetRejectedItemsAsync(
        int taskId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var task = await _unitOfWork.AnnotationTasks.GetWithTaskItemsAsync(taskId, cancellationToken);
        if (task == null)
            throw new NotFoundException("Task", taskId);

        if (task.AnnotatorId != userId)
            throw new ForbiddenException("You are not assigned to this task");

        var rejectedItems = new List<RejectedItemDto>();

        foreach (var taskItem in task.TaskItems)
        {
            var dataItem = await _unitOfWork.DataItems.GetByIdAsync(taskItem.DataItemId, cancellationToken);
            if (dataItem == null || dataItem.Status != DataItemStatus.Rejected)
                continue;

            // Get the latest review with rejection details
            var latestReview = await _unitOfWork.Reviews.GetLatestByDataItemIdAsync(dataItem.Id, cancellationToken);

            var errorTypeNames = new List<string>();
            if (latestReview != null)
            {
                var reviewWithErrors = await _unitOfWork.Reviews.GetWithErrorTypesAsync(latestReview.Id, cancellationToken);
                if (reviewWithErrors != null)
                {
                    errorTypeNames = reviewWithErrors.ReviewErrorTypes
                        .Select(ret => ret.ErrorType?.Name ?? "")
                        .Where(n => !string.IsNullOrEmpty(n))
                        .ToList();
                }
            }

            rejectedItems.Add(new RejectedItemDto
            {
                TaskItemId = taskItem.Id,
                DataItemId = dataItem.Id,
                FileName = dataItem.FileName,
                ThumbnailPath = dataItem.ThumbnailPath,
                Feedback = latestReview?.Feedback,
                ErrorTypes = errorTypeNames,
                RejectedAt = latestReview?.CreatedAt ?? dataItem.UpdatedAt ?? DateTime.UtcNow
            });
        }

        return rejectedItems.OrderByDescending(r => r.RejectedAt);
    }
}
