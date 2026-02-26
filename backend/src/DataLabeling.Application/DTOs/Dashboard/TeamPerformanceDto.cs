namespace DataLabeling.Application.DTOs.Dashboard;

/// <summary>
/// Team member performance DTO.
/// </summary>
public class TeamPerformanceDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = default!;
    public string Role { get; set; } = default!;
    public int TasksCompleted { get; set; }
    public int ItemsProcessed { get; set; }
    public double AverageAccuracy { get; set; }
}

/// <summary>
/// Project overview DTO for manager dashboard.
/// </summary>
public class ProjectOverviewDto
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = default!;
    public string Status { get; set; } = default!;
    public int TotalItems { get; set; }
    public int CompletedItems { get; set; }
    public double ProgressPercent { get; set; }
    public DateOnly? Deadline { get; set; }
}

/// <summary>
/// Recent task DTO for annotator dashboard.
/// </summary>
public class RecentTaskDto
{
    public int TaskId { get; set; }
    public string ProjectName { get; set; } = default!;
    public string Status { get; set; } = default!;
    public int TotalItems { get; set; }
    public int CompletedItems { get; set; }
    public double ProgressPercent { get; set; }
    public DateTime AssignedAt { get; set; }
}

/// <summary>
/// Pending review item DTO for reviewer dashboard.
/// </summary>
public class DashboardPendingReviewItemDto
{
    public int DataItemId { get; set; }
    public string FileName { get; set; } = default!;
    public string ProjectName { get; set; } = default!;
    public string AnnotatorName { get; set; } = default!;
    public DateTime SubmittedAt { get; set; }
}

/// <summary>
/// Recent review DTO for reviewer dashboard.
/// </summary>
public class RecentReviewDto
{
    public int ReviewId { get; set; }
    public string FileName { get; set; } = default!;
    public string Decision { get; set; } = default!;
    public DateTime ReviewedAt { get; set; }
}

/// <summary>
/// Notification DTO.
/// </summary>
public class NotificationDto
{
    public int Id { get; set; }
    public string Type { get; set; } = default!;
    public string Title { get; set; } = default!;
    public string? Content { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
