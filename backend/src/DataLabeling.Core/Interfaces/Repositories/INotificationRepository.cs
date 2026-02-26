using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for Notification entity operations.
/// </summary>
public interface INotificationRepository : IRepository<Notification>
{
    /// <summary>
    /// Gets all notifications for a specific user.
    /// </summary>
    Task<IEnumerable<Notification>> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets unread notifications for a specific user.
    /// </summary>
    Task<IEnumerable<Notification>> GetUnreadByUserIdAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets notifications with pagination.
    /// </summary>
    Task<(IEnumerable<Notification> Items, int TotalCount)> GetPagedByUserIdAsync(
        int userId,
        int pageNumber,
        int pageSize,
        bool unreadOnly = false,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets unread notification count for a user.
    /// </summary>
    Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks a notification as read.
    /// </summary>
    Task MarkAsReadAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks all notifications as read for a user.
    /// </summary>
    Task MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a notification for a user.
    /// </summary>
    Task<Notification> CreateNotificationAsync(
        int userId,
        NotificationType type,
        string title,
        string? content = null,
        string? referenceType = null,
        int? referenceId = null,
        CancellationToken cancellationToken = default);
}
