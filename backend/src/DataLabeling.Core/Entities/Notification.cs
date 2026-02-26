using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Entities;

/// <summary>
/// Notification entity - represents a notification for a user.
/// </summary>
public class Notification : BaseEntity
{
    /// <summary>
    /// Foreign key to the user receiving this notification.
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Type of notification.
    /// </summary>
    public NotificationType Type { get; set; }

    /// <summary>
    /// Notification title.
    /// </summary>
    public required string Title { get; set; }

    /// <summary>
    /// Notification content/message.
    /// </summary>
    public string? Content { get; set; }

    /// <summary>
    /// Type of the referenced entity (Task, Project, DataItem).
    /// </summary>
    public string? ReferenceType { get; set; }

    /// <summary>
    /// ID of the referenced entity.
    /// </summary>
    public int? ReferenceId { get; set; }

    /// <summary>
    /// Whether the notification has been read.
    /// </summary>
    public bool IsRead { get; set; } = false;

    // ==================== Navigation Properties ====================

    /// <summary>
    /// User this notification belongs to.
    /// </summary>
    public virtual User User { get; set; } = null!;
}
