using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Notifications;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Interfaces;

namespace DataLabeling.Application.Services;

/// <summary>
/// Service implementation for notification operations.
/// </summary>
public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _uow;

    public NotificationService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<PagedResult<NotificationDto>> GetNotificationsAsync(
        int userId, int pageNumber, int pageSize, bool unreadOnly,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _uow.Notifications.GetPagedByUserIdAsync(
            userId, pageNumber, pageSize, unreadOnly, cancellationToken);

        var dtos = items.Select(n => new NotificationDto
        {
            Id = n.Id,
            Type = n.Type,
            Title = n.Title,
            Content = n.Content,
            ReferenceType = n.ReferenceType,
            ReferenceId = n.ReferenceId,
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt
        });

        return new PagedResult<NotificationDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _uow.Notifications.GetUnreadCountAsync(userId, cancellationToken);
    }

    public async Task MarkAsReadAsync(int userId, int notificationId, CancellationToken cancellationToken = default)
    {
        var notification = await _uow.Notifications.GetByIdAsync(notificationId, cancellationToken);
        if (notification == null || notification.UserId != userId)
            throw new KeyNotFoundException("Notification not found.");

        await _uow.Notifications.MarkAsReadAsync(notificationId, cancellationToken);
    }

    public async Task MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default)
    {
        await _uow.Notifications.MarkAllAsReadAsync(userId, cancellationToken);
    }
}
