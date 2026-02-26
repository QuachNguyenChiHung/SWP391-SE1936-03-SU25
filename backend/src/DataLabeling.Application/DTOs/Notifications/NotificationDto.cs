using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.Notifications;

/// <summary>
/// Data transfer object for Notification entity.
/// </summary>
public class NotificationDto
{
    /// <summary>
    /// Notification unique identifier.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Type of notification.
    /// </summary>
    public NotificationType Type { get; set; }

    /// <summary>
    /// Notification type as string.
    /// </summary>
    public string TypeName => Type.ToString();

    /// <summary>
    /// Notification title.
    /// </summary>
    public string Title { get; set; } = string.Empty;

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
    public bool IsRead { get; set; }

    /// <summary>
    /// When the notification was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
