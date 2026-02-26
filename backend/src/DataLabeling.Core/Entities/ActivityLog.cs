using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Entities;

/// <summary>
/// ActivityLog entity - audit trail for all actions in the system.
/// Does NOT inherit from BaseEntity (only has CreatedAt, no UpdatedAt).
/// </summary>
public class ActivityLog
{
    /// <summary>
    /// Primary key.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the user who performed the action.
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Type of action performed.
    /// </summary>
    public ActivityAction Action { get; set; }

    /// <summary>
    /// Type of entity that was affected (Project, Task, User, etc.).
    /// </summary>
    public required string TargetType { get; set; }

    /// <summary>
    /// ID of the entity that was affected.
    /// </summary>
    public int? TargetId { get; set; }

    /// <summary>
    /// Additional details as JSON.
    /// Example: {"changes":[{"field":"Status","oldValue":"Draft","newValue":"Active"}]}
    /// </summary>
    public string? Details { get; set; }

    /// <summary>
    /// IP address of the user.
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent string from the browser.
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// When this action occurred.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ==================== Navigation Properties ====================

    /// <summary>
    /// User who performed this action.
    /// </summary>
    public virtual User User { get; set; } = null!;
}
