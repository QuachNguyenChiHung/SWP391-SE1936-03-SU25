namespace DataLabeling.Application.DTOs.Dashboard;

/// <summary>
/// Reviewer dashboard response DTO.
/// </summary>
public class ReviewerDashboardDto
{
    /// <summary>
    /// Reviewer statistics.
    /// </summary>
    public ReviewerStatsDto Stats { get; set; } = new();

    /// <summary>
    /// Items pending review.
    /// </summary>
    public List<PendingReviewItemDto> PendingQueue { get; set; } = new();

    /// <summary>
    /// Recent reviews by this reviewer.
    /// </summary>
    public List<RecentReviewDto> RecentReviews { get; set; } = new();
}
