using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Notifications;

namespace DataLabeling.Application.Interfaces;

/// <summary>
/// Service interface for notification operations.
/// </summary>
public interface INotificationService
{
    Task<PagedResult<NotificationDto>> GetNotificationsAsync(
        int userId, int pageNumber, int pageSize, bool unreadOnly,
        CancellationToken cancellationToken = default);

    Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default);

    Task MarkAsReadAsync(int userId, int notificationId, CancellationToken cancellationToken = default);

    Task MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default);
}
