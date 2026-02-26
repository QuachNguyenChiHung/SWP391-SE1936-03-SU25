using DataLabeling.Application.DTOs.ActivityLog;
using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Interfaces;

namespace DataLabeling.Application.Services;

/// <summary>
/// Service for activity logging operations.
/// </summary>
public class ActivityLogService : IActivityLogService
{
    private readonly IUnitOfWork _unitOfWork;

    public ActivityLogService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    /// <inheritdoc/>
    public async Task LogAsync(
        int userId,
        ActivityAction action,
        string targetType,
        int? targetId = null,
        string? details = null,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default)
    {
        await _unitOfWork.ActivityLogs.LogAsync(
            userId,
            action,
            targetType,
            targetId,
            details,
            ipAddress,
            userAgent,
            cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<PagedResult<ActivityLogDto>> GetLogsAsync(
        ActivityLogFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _unitOfWork.ActivityLogs.GetPagedAsync(
            request.PageNumber,
            request.PageSize,
            request.UserId,
            request.Action,
            request.TargetType,
            request.StartDate,
            request.EndDate,
            cancellationToken);

        return new PagedResult<ActivityLogDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<ActivityLogDto>> GetRecentByUserAsync(
        int userId,
        int count = 10,
        CancellationToken cancellationToken = default)
    {
        var logs = await _unitOfWork.ActivityLogs.GetRecentByUserIdAsync(userId, count, cancellationToken);
        return logs.Select(MapToDto);
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<ActivityLogDto>> GetByTargetAsync(
        string targetType,
        int targetId,
        CancellationToken cancellationToken = default)
    {
        var logs = await _unitOfWork.ActivityLogs.GetByTargetAsync(targetType, targetId, cancellationToken);
        return logs.Select(MapToDto);
    }

    private static ActivityLogDto MapToDto(ActivityLog log)
    {
        return new ActivityLogDto
        {
            Id = log.Id,
            UserId = log.UserId,
            UserName = log.User?.Name ?? string.Empty,
            Action = log.Action.ToString(),
            TargetType = log.TargetType,
            TargetId = log.TargetId,
            Details = log.Details,
            IpAddress = log.IpAddress,
            CreatedAt = log.CreatedAt
        };
    }
}
