using DataLabeling.Application.DTOs.ActivityLog;
using DataLabeling.Application.DTOs.Common;
using DataLabeling.Core.Enums;

namespace DataLabeling.Application.Interfaces;

/// <summary>
/// Service interface for activity logging operations.
/// </summary>
public interface IActivityLogService
{
    /// <summary>
    /// Logs an activity.
    /// </summary>
    /// <param name="userId">ID of the user performing the action.</param>
    /// <param name="action">Type of action.</param>
    /// <param name="targetType">Type of entity affected.</param>
    /// <param name="targetId">ID of the entity affected (optional).</param>
    /// <param name="details">Additional details as JSON string (optional).</param>
    /// <param name="ipAddress">IP address of the user (optional).</param>
    /// <param name="userAgent">User agent string (optional).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task LogAsync(
        int userId,
        ActivityAction action,
        string targetType,
        int? targetId = null,
        string? details = null,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets activity logs with pagination and filtering.
    /// </summary>
    /// <param name="request">Filter and pagination parameters.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Paginated list of activity logs.</returns>
    Task<PagedResult<ActivityLogDto>> GetLogsAsync(
        ActivityLogFilterRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets recent activity for a specific user.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="count">Number of recent activities to return.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of recent activity logs.</returns>
    Task<IEnumerable<ActivityLogDto>> GetRecentByUserAsync(
        int userId,
        int count = 10,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets activity logs for a specific target entity.
    /// </summary>
    /// <param name="targetType">Type of entity.</param>
    /// <param name="targetId">ID of the entity.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of activity logs for the target.</returns>
    Task<IEnumerable<ActivityLogDto>> GetByTargetAsync(
        string targetType,
        int targetId,
        CancellationToken cancellationToken = default);
}
