namespace DataLabeling.Application.DTOs.Dashboard;

/// <summary>
/// Reviewer dashboard response DTO.
/// </summary>
public class ReviewerDashboardDto
{
    /// <summary>
    /// Reviewer specialization (areas of expertise).
    /// </summary>
    public string? SpecializeIn { get; set; }
    /// <summary>
    /// Reviewer statistics.
    /// </summary>
    public DashboardReviewerStatsDto Stats { get; set; } = new();

    /// <summary>
    /// Items pending review.
    /// </summary>
    public List<DashboardPendingReviewItemDto> PendingQueue { get; set; } = new();

    /// <summary>
    /// Recent reviews by this reviewer.
    /// </summary>
    public List<RecentReviewDto> RecentReviews { get; set; } = new();
}
