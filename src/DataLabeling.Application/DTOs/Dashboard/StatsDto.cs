namespace DataLabeling.Application.DTOs.Dashboard;

/// <summary>
/// Annotator statistics.
/// </summary>
public class AnnotatorStatsDto
{
    public int TotalAssigned { get; set; }
    public int InProgress { get; set; }
    public int Completed { get; set; }
    public int PendingReview { get; set; }
}

/// <summary>
/// Reviewer statistics.
/// </summary>
public class ReviewerStatsDto
{
    public int PendingReview { get; set; }
    public int ReviewedToday { get; set; }
    public int TotalReviewed { get; set; }
    public double ApprovalRate { get; set; }
}

/// <summary>
/// Manager statistics.
/// </summary>
public class ManagerStatsDto
{
    public int TotalProjects { get; set; }
    public int ActiveProjects { get; set; }
    public int TotalItems { get; set; }
    public double CompletionRate { get; set; }
}
