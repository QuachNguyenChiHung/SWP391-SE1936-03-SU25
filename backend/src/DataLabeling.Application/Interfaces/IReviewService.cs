using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Reviews;

namespace DataLabeling.Application.Interfaces;

/// <summary>
/// Service interface for review operations.
/// </summary>
public interface IReviewService
{
    // ==================== Review Operations ====================

    /// <summary>
    /// Creates a review for a data item (approve or reject).
    /// </summary>
    Task<ReviewDto> CreateReviewAsync(
        int dataItemId,
        CreateReviewRequest request,
        int reviewerId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a review by ID.
    /// </summary>
    Task<ReviewDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all reviews for a data item.
    /// </summary>
    Task<IEnumerable<ReviewDto>> GetByDataItemIdAsync(
        int dataItemId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the latest review for a data item.
    /// </summary>
    Task<ReviewDto?> GetLatestByDataItemIdAsync(
        int dataItemId,
        CancellationToken cancellationToken = default);

    // ==================== Pending Review Items ====================

    /// <summary>
    /// Gets paginated list of items pending review.
    /// </summary>
    Task<PagedResult<PendingReviewItemDto>> GetPendingReviewItemsAsync(
        int pageNumber,
        int pageSize,
        int? projectId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets review editor data for a data item.
    /// </summary>
    Task<ReviewEditorDto?> GetReviewEditorDataAsync(
        int dataItemId,
        CancellationToken cancellationToken = default);

    // ==================== Error Types ====================

    /// <summary>
    /// Gets all available error types.
    /// </summary>
    Task<IEnumerable<ErrorTypeDto>> GetErrorTypesAsync(CancellationToken cancellationToken = default);

    // ==================== Statistics ====================

    /// <summary>
    /// Gets reviewer statistics.
    /// </summary>
    Task<ReviewerStatsDto> GetReviewerStatisticsAsync(
        int reviewerId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// DTO for reviewer statistics.
/// </summary>
public class ReviewerStatsDto
{
    public int ReviewerId { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public int TotalReviewed { get; set; }
    public int ApprovedCount { get; set; }
    public int RejectedCount { get; set; }
    public double ApprovalRate { get; set; }
}
