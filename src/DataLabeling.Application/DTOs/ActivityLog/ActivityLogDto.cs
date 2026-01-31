namespace DataLabeling.Application.DTOs.ActivityLog;

/// <summary>
/// DTO for activity log entries.
/// </summary>
public class ActivityLogDto
{
    /// <summary>
    /// Activity log ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ID of the user who performed the action.
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Name of the user who performed the action.
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// Type of action performed (e.g., Create, Update, Delete).
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// Type of entity that was affected (e.g., Annotation, Project, User).
    /// </summary>
    public string TargetType { get; set; } = string.Empty;

    /// <summary>
    /// ID of the entity that was affected.
    /// </summary>
    public int? TargetId { get; set; }

    /// <summary>
    /// Additional details about the action as JSON string.
    /// </summary>
    public string? Details { get; set; }

    /// <summary>
    /// IP address of the user who performed the action.
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// When the action was performed.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
