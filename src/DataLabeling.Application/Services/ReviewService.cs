using System.Text.Json;
using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Reviews;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces;

namespace DataLabeling.Application.Services;

/// <summary>
/// Service for review operations.
/// </summary>
public class ReviewService : IReviewService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IActivityLogService _activityLogService;

    public ReviewService(IUnitOfWork unitOfWork, IActivityLogService activityLogService)
    {
        _unitOfWork = unitOfWork;
        _activityLogService = activityLogService;
    }

    public async Task<ReviewDto> CreateReviewAsync(
        int dataItemId,
        CreateReviewRequest request,
        int reviewerId,
        CancellationToken cancellationToken = default)
    {
        // Validate data item exists
        var dataItem = await _unitOfWork.DataItems.GetByIdAsync(dataItemId, cancellationToken);
        if (dataItem == null)
            throw new NotFoundException("DataItem", dataItemId);

        // Validate data item is in Submitted status
        if (dataItem.Status != DataItemStatus.Submitted)
            throw new ValidationException($"Data item is not ready for review. Current status: {dataItem.Status}");

        // Validate reviewer exists and has Reviewer role
        var reviewer = await _unitOfWork.Users.GetByIdAsync(reviewerId, cancellationToken);
        if (reviewer == null)
            throw new NotFoundException("User", reviewerId);

        if (reviewer.Role != UserRole.Reviewer && reviewer.Role != UserRole.Admin)
            throw new ForbiddenException("Only reviewers can create reviews");

        // Validate rejection requirements
        if (request.Decision == ReviewDecision.Rejected)
        {
            if (string.IsNullOrWhiteSpace(request.Feedback))
                throw new ValidationException("Feedback is required when rejecting");

            if (request.ErrorTypeIds == null || request.ErrorTypeIds.Length == 0)
                throw new ValidationException("At least one error type is required when rejecting");

            // Validate error types exist
            var errorTypes = await _unitOfWork.ErrorTypes.GetByIdsAsync(request.ErrorTypeIds, cancellationToken);
            if (errorTypes.Count() != request.ErrorTypeIds.Length)
                throw new ValidationException("One or more error types are invalid");
        }

        // Create review
        var review = new Review
        {
            DataItemId = dataItemId,
            ReviewerId = reviewerId,
            Decision = request.Decision,
            Feedback = request.Feedback
        };

        await _unitOfWork.Reviews.AddAsync(review, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Add error types if rejected
        if (request.Decision == ReviewDecision.Rejected && request.ErrorTypeIds.Length > 0)
        {
            foreach (var errorTypeId in request.ErrorTypeIds)
            {
                var reviewErrorType = new ReviewErrorType
                {
                    ReviewId = review.Id,
                    ErrorTypeId = errorTypeId
                };
                review.ReviewErrorTypes.Add(reviewErrorType);
            }
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        // Update data item status
        dataItem.Status = request.Decision == ReviewDecision.Approved
            ? DataItemStatus.Approved
            : DataItemStatus.Rejected;
        dataItem.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.DataItems.Update(dataItem);

        // If approved, check if task is complete
        if (request.Decision == ReviewDecision.Approved)
        {
            await CheckAndUpdateTaskCompletionAsync(dataItemId, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Log activity
        var action = request.Decision == ReviewDecision.Approved ? ActivityAction.Approve : ActivityAction.Reject;
        await _activityLogService.LogAsync(
            reviewerId,
            action,
            "DataItem",
            dataItemId,
            JsonSerializer.Serialize(new { reviewId = review.Id, decision = request.Decision.ToString(), feedback = request.Feedback }),
            cancellationToken: cancellationToken);

        return await GetByIdAsync(review.Id, cancellationToken) ?? throw new Exception("Failed to create review");
    }

    public async Task<ReviewDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var review = await _unitOfWork.Reviews.GetWithErrorTypesAsync(id, cancellationToken);
        if (review == null) return null;

        var reviewer = await _unitOfWork.Users.GetByIdAsync(review.ReviewerId, cancellationToken);

        return new ReviewDto
        {
            Id = review.Id,
            DataItemId = review.DataItemId,
            ReviewerId = review.ReviewerId,
            ReviewerName = reviewer?.Name ?? "",
            Decision = review.Decision,
            Feedback = review.Feedback,
            ErrorTypes = review.ReviewErrorTypes.Select(ret => new ErrorTypeDto
            {
                Id = ret.ErrorType.Id,
                Code = ret.ErrorType.Code,
                Name = ret.ErrorType.Name,
                Description = ret.ErrorType.Description
            }).ToList(),
            CreatedAt = review.CreatedAt
        };
    }

    public async Task<IEnumerable<ReviewDto>> GetByDataItemIdAsync(
        int dataItemId,
        CancellationToken cancellationToken = default)
    {
        var reviews = await _unitOfWork.Reviews.GetByDataItemIdAsync(dataItemId, cancellationToken);
        var result = new List<ReviewDto>();

        foreach (var review in reviews)
        {
            var dto = await GetByIdAsync(review.Id, cancellationToken);
            if (dto != null) result.Add(dto);
        }

        return result.OrderByDescending(r => r.CreatedAt);
    }

    public async Task<ReviewDto?> GetLatestByDataItemIdAsync(
        int dataItemId,
        CancellationToken cancellationToken = default)
    {
        var review = await _unitOfWork.Reviews.GetLatestByDataItemIdAsync(dataItemId, cancellationToken);
        if (review == null) return null;

        return await GetByIdAsync(review.Id, cancellationToken);
    }

    public async Task<PagedResult<PendingReviewItemDto>> GetPendingReviewItemsAsync(
        int pageNumber,
        int pageSize,
        int? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _unitOfWork.Reviews.GetPendingReviewItemsPagedAsync(
            pageNumber, pageSize, projectId, cancellationToken);

        var result = new List<PendingReviewItemDto>();

        foreach (var item in items)
        {
            var dataset = await _unitOfWork.Datasets.GetByIdAsync(item.DatasetId, cancellationToken);
            var project = dataset != null
                ? await _unitOfWork.Projects.GetByIdAsync(dataset.ProjectId, cancellationToken)
                : null;

            // Get annotator name from task
            var taskItems = await _unitOfWork.TaskItems.GetByDataItemIdAsync(item.Id, cancellationToken);
            var taskItem = taskItems.FirstOrDefault();
            string annotatorName = "";
            DateTime submittedAt = item.UpdatedAt ?? item.CreatedAt;

            if (taskItem != null)
            {
                var task = await _unitOfWork.AnnotationTasks.GetByIdAsync(taskItem.TaskId, cancellationToken);
                if (task != null)
                {
                    var annotator = await _unitOfWork.Users.GetByIdAsync(task.AnnotatorId, cancellationToken);
                    annotatorName = annotator?.Name ?? "";
                    submittedAt = taskItem.CompletedAt ?? submittedAt;
                }
            }

            // Get annotation count
            var annotations = await _unitOfWork.Annotations.GetByDataItemIdAsync(item.Id, cancellationToken);

            result.Add(new PendingReviewItemDto
            {
                Id = item.Id,
                DatasetId = item.DatasetId,
                ProjectId = project?.Id ?? 0,
                ProjectName = project?.Name ?? "",
                FileName = item.FileName,
                FilePath = item.FilePath,
                ThumbnailPath = item.ThumbnailPath,
                AnnotationCount = annotations.Count(),
                AnnotatorName = annotatorName,
                SubmittedAt = submittedAt
            });
        }

        return new PagedResult<PendingReviewItemDto>
        {
            Items = result,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<ReviewEditorDto?> GetReviewEditorDataAsync(
        int dataItemId,
        CancellationToken cancellationToken = default)
    {
        var dataItem = await _unitOfWork.DataItems.GetByIdAsync(dataItemId, cancellationToken);
        if (dataItem == null) return null;

        var dataset = await _unitOfWork.Datasets.GetByIdAsync(dataItem.DatasetId, cancellationToken);
        if (dataset == null) return null;

        var project = await _unitOfWork.Projects.GetByIdAsync(dataset.ProjectId, cancellationToken);
        if (project == null) return null;

        // Get annotations
        var annotations = await _unitOfWork.Annotations.GetByDataItemIdWithLabelAsync(dataItemId, cancellationToken);

        // Get error types
        var errorTypes = await _unitOfWork.ErrorTypes.GetAllAsync(cancellationToken);

        // Get previous reviews
        var previousReviews = await GetByDataItemIdAsync(dataItemId, cancellationToken);

        // Get navigation (other pending items in same project)
        var (pendingItems, _) = await _unitOfWork.Reviews.GetPendingReviewItemsPagedAsync(
            1, 1000, dataset.ProjectId, cancellationToken);
        var pendingList = pendingItems.OrderBy(i => i.Id).ToList();
        var currentIndex = pendingList.FindIndex(i => i.Id == dataItemId);

        int? prevId = currentIndex > 0 ? pendingList[currentIndex - 1].Id : null;
        int? nextId = currentIndex >= 0 && currentIndex < pendingList.Count - 1
            ? pendingList[currentIndex + 1].Id
            : null;

        return new ReviewEditorDto
        {
            DataItemId = dataItemId,
            ProjectId = project.Id,
            ProjectName = project.Name,
            FileName = dataItem.FileName,
            FilePath = dataItem.FilePath,
            Annotations = annotations.Select(a => new ReviewAnnotationDto
            {
                Id = a.Id,
                LabelId = a.LabelId,
                LabelName = a.Label?.Name ?? "",
                LabelColor = a.Label?.Color ?? "",
                Coordinates = a.Coordinates,
                Attributes = a.Attributes
            }).ToList(),
            ErrorTypes = errorTypes.Select(e => new ErrorTypeDto
            {
                Id = e.Id,
                Code = e.Code,
                Name = e.Name,
                Description = e.Description
            }).ToList(),
            PreviousReviews = previousReviews.ToList(),
            Navigation = new ReviewNavigationDto
            {
                PreviousDataItemId = prevId,
                NextDataItemId = nextId,
                CurrentIndex = currentIndex >= 0 ? currentIndex + 1 : 0,
                TotalItems = pendingList.Count
            }
        };
    }

    public async Task<IEnumerable<ErrorTypeDto>> GetErrorTypesAsync(CancellationToken cancellationToken = default)
    {
        var errorTypes = await _unitOfWork.ErrorTypes.GetAllAsync(cancellationToken);
        return errorTypes.Select(e => new ErrorTypeDto
        {
            Id = e.Id,
            Code = e.Code,
            Name = e.Name,
            Description = e.Description
        });
    }

    public async Task<ReviewerStatsDto> GetReviewerStatisticsAsync(
        int reviewerId,
        CancellationToken cancellationToken = default)
    {
        var reviewer = await _unitOfWork.Users.GetByIdAsync(reviewerId, cancellationToken);
        if (reviewer == null)
            throw new NotFoundException("User", reviewerId);

        var stats = await _unitOfWork.Reviews.GetReviewerStatisticsAsync(reviewerId, cancellationToken);

        return new ReviewerStatsDto
        {
            ReviewerId = reviewerId,
            ReviewerName = reviewer.Name,
            TotalReviewed = stats.TotalReviewed,
            ApprovedCount = stats.ApprovedCount,
            RejectedCount = stats.RejectedCount,
            ApprovalRate = stats.ApprovalRate
        };
    }

    private async Task CheckAndUpdateTaskCompletionAsync(int dataItemId, CancellationToken cancellationToken)
    {
        // Find task items for this data item
        var taskItems = await _unitOfWork.TaskItems.GetByDataItemIdAsync(dataItemId, cancellationToken);

        foreach (var taskItem in taskItems)
        {
            var task = await _unitOfWork.AnnotationTasks.GetWithTaskItemsAsync(taskItem.TaskId, cancellationToken);
            if (task == null) continue;

            // Check if all items in the task are approved
            bool allApproved = true;
            foreach (var ti in task.TaskItems)
            {
                var di = await _unitOfWork.DataItems.GetByIdAsync(ti.DataItemId, cancellationToken);
                if (di == null || di.Status != DataItemStatus.Approved)
                {
                    allApproved = false;
                    break;
                }
            }

            // If all items approved, mark task as completed
            if (allApproved && task.Status == AnnotationTaskStatus.Submitted)
            {
                task.Status = AnnotationTaskStatus.Completed;
                task.CompletedAt = DateTime.UtcNow;
                task.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.AnnotationTasks.Update(task);
            }
        }
    }
}
