using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for ActivityLog entity operations.
/// Note: ActivityLog does not inherit from BaseEntity.
/// </summary>
public interface IActivityLogRepository
{
    /// <summary>
    /// Gets an activity log by ID.
    /// </summary>
    Task<ActivityLog?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all activity logs for a specific user.
    /// </summary>
    Task<IEnumerable<ActivityLog>> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets activity logs for a specific target.
    /// </summary>
    Task<IEnumerable<ActivityLog>> GetByTargetAsync(string targetType, int targetId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets activity logs by action type.
    /// </summary>
    Task<IEnumerable<ActivityLog>> GetByActionAsync(ActivityAction action, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets activity logs with pagination and filtering.
    /// </summary>
    Task<(IEnumerable<ActivityLog> Items, int TotalCount)> GetPagedAsync(
        int pageNumber,
        int pageSize,
        int? userId = null,
        ActivityAction? action = null,
        string? targetType = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Logs an activity.
    /// </summary>
    Task<ActivityLog> LogAsync(
        int userId,
        ActivityAction action,
        string targetType,
        int? targetId = null,
        string? details = null,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets recent activity for a user.
    /// </summary>
    Task<IEnumerable<ActivityLog>> GetRecentByUserIdAsync(int userId, int count = 10, CancellationToken cancellationToken = default);
}
