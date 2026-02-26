using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Notifications;
using DataLabeling.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DataLabeling.API.Controllers;

/// <summary>
/// Controller for notification operations.
/// </summary>
[Route("api/notifications")]
[ApiController]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public NotificationsController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                 ?? User.FindFirst("sub");

        if (claim != null && int.TryParse(claim.Value, out int userId))
            return userId;

        return 0;
    }

    /// <summary>
    /// Get paginated list of notifications for the current user.
    /// </summary>
    /// <param name="pageNumber">Page number (default: 1).</param>
    /// <param name="pageSize">Items per page (default: 20).</param>
    /// <param name="unreadOnly">If true, returns only unread notifications.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<NotificationDto>>), 200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationDto>>>> GetNotifications(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool unreadOnly = false,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token." });

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

        var result = new PagedResult<NotificationDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return Ok(ApiResponse<PagedResult<NotificationDto>>.SuccessResponse(result));
    }

    /// <summary>
    /// Get unread notification count for the current user.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(ApiResponse<int>), 200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount(
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token." });

        var count = await _uow.Notifications.GetUnreadCountAsync(userId, cancellationToken);

        return Ok(ApiResponse<int>.SuccessResponse(count));
    }

    /// <summary>
    /// Mark a specific notification as read.
    /// </summary>
    /// <param name="id">Notification ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpPatch("{id:int}/read")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ApiResponse>> MarkAsRead(
        int id,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token." });

        var notification = await _uow.Notifications.GetByIdAsync(id, cancellationToken);
        if (notification == null || notification.UserId != userId)
            return NotFound(ApiResponse.FailureResponse("Notification not found."));

        await _uow.Notifications.MarkAsReadAsync(id, cancellationToken);

        return Ok(ApiResponse.SuccessResponse("Notification marked as read."));
    }

    /// <summary>
    /// Mark all notifications as read for the current user.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpPatch("read-all")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<ApiResponse>> MarkAllAsRead(
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token." });

        await _uow.Notifications.MarkAllAsReadAsync(userId, cancellationToken);

        return Ok(ApiResponse.SuccessResponse("All notifications marked as read."));
    }
}
