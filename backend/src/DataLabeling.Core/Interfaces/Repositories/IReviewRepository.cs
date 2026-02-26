using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for Review entity operations.
/// </summary>
public interface IReviewRepository : IRepository<Review>
{
    /// <summary>
    /// Gets all reviews for a specific data item.
    /// </summary>
    Task<IEnumerable<Review>> GetByDataItemIdAsync(int dataItemId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all reviews by a specific reviewer.
    /// </summary>
    Task<IEnumerable<Review>> GetByReviewerIdAsync(int reviewerId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the latest review for a data item.
    /// </summary>
    Task<Review?> GetLatestByDataItemIdAsync(int dataItemId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets review with error types.
    /// </summary>
    Task<Review?> GetWithErrorTypesAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets data items pending review for a project.
    /// </summary>
    Task<IEnumerable<DataItem>> GetPendingReviewItemsAsync(int projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets pending review items with pagination.
    /// </summary>
    Task<(IEnumerable<DataItem> Items, int TotalCount)> GetPendingReviewItemsPagedAsync(
        int pageNumber,
        int pageSize,
        int? projectId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets review statistics for a reviewer.
    /// </summary>
    Task<ReviewerStatistics> GetReviewerStatisticsAsync(int reviewerId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Reviewer statistics DTO.
/// </summary>
public class ReviewerStatistics
{
    public int TotalReviewed { get; set; }
    public int ApprovedCount { get; set; }
    public int RejectedCount { get; set; }
    public double ApprovalRate => TotalReviewed > 0 ? (double)ApprovedCount / TotalReviewed * 100 : 0;
}
