using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.ActivityLog;

/// <summary>
/// Request DTO for filtering activity logs.
/// </summary>
public class ActivityLogFilterRequest
{
    /// <summary>
    /// Filter by user ID.
    /// </summary>
    public int? UserId { get; set; }

    /// <summary>
    /// Filter by action type.
    /// </summary>
    public ActivityAction? Action { get; set; }

    /// <summary>
    /// Filter by target type (e.g., "Annotation", "Project").
    /// </summary>
    public string? TargetType { get; set; }

    /// <summary>
    /// Filter by start date (inclusive).
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// Filter by end date (inclusive).
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Page number for pagination (1-based).
    /// </summary>
    public int PageNumber { get; set; } = 1;

    /// <summary>
    /// Page size for pagination.
    /// </summary>
    public int PageSize { get; set; } = 20;
}
