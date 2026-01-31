using DataLabeling.Application.DTOs.ActivityLog;
using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DataLabeling.API.Controllers;

/// <summary>
/// Controller for activity log operations.
/// </summary>
[Route("api/activity-logs")]
[ApiController]
[Authorize]
public class ActivityLogsController : ControllerBase
{
    private readonly IActivityLogService _activityLogService;

    public ActivityLogsController(IActivityLogService activityLogService)
    {
        _activityLogService = activityLogService;
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                 ?? User.FindFirst("sub");

        if (claim != null && int.TryParse(claim.Value, out int userId))
        {
            return userId;
        }

        return 0;
    }

    /// <summary>
    /// Get paginated list of activity logs with filters.
    /// Admin only.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PagedResult<ActivityLogDto>), 200)]
    public async Task<ActionResult<PagedResult<ActivityLogDto>>> GetLogs(
        [FromQuery] int? userId = null,
        [FromQuery] ActivityAction? action = null,
        [FromQuery] string? targetType = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var request = new ActivityLogFilterRequest
        {
            UserId = userId,
            Action = action,
            TargetType = targetType,
            StartDate = startDate,
            EndDate = endDate,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        var result = await _activityLogService.GetLogsAsync(request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get current user's recent activity.
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(IEnumerable<ActivityLogDto>), 200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<IEnumerable<ActivityLogDto>>> GetMyActivity(
        [FromQuery] int count = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token" });

        var logs = await _activityLogService.GetRecentByUserAsync(userId, count, cancellationToken);
        return Ok(logs);
    }

    /// <summary>
    /// Get activity logs for a specific entity.
    /// Admin and Manager only.
    /// </summary>
    [HttpGet("target/{targetType}/{targetId:int}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(IEnumerable<ActivityLogDto>), 200)]
    public async Task<ActionResult<IEnumerable<ActivityLogDto>>> GetByTarget(
        string targetType,
        int targetId,
        CancellationToken cancellationToken = default)
    {
        var logs = await _activityLogService.GetByTargetAsync(targetType, targetId, cancellationToken);
        return Ok(logs);
    }
}
