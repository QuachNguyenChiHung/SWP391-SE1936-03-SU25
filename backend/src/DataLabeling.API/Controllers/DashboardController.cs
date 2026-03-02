using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Dashboard;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DataLabeling.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                 ?? User.FindFirst("sub")
                 ?? User.FindFirst("id")
                 ?? User.FindFirst("userId");

        if (claim != null && int.TryParse(claim.Value, out int userId))
        {
            return userId;
        }
        return 0;
    }

    [HttpGet("annotator")]
    [Authorize(Roles = "Annotator")]
    [ProducesResponseType(typeof(ApiResponse<AnnotatorDashboardDto>), 200)]
    public async Task<ActionResult<ApiResponse<AnnotatorDashboardDto>>> GetAnnotatorDashboard(CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var result = await _dashboardService.GetAnnotatorDashboardAsync(userId, cancellationToken);
        return Ok(ApiResponse<AnnotatorDashboardDto>.SuccessResponse(result));
    }

    [HttpGet("reviewer")]
    [Authorize(Roles = "Reviewer")]
    [ProducesResponseType(typeof(ApiResponse<ReviewerDashboardDto>), 200)]
    public async Task<ActionResult<ApiResponse<ReviewerDashboardDto>>> GetReviewerDashboard(CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var result = await _dashboardService.GetReviewerDashboardAsync(userId, cancellationToken);
        return Ok(ApiResponse<ReviewerDashboardDto>.SuccessResponse(result));
    }

    [HttpGet("manager")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse<ManagerDashboardDto>), 200)]
    public async Task<ActionResult<ApiResponse<ManagerDashboardDto>>> GetManagerDashboard(CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var isAdmin = User.FindFirst(ClaimTypes.Role)?.Value == UserRole.Admin.ToString();
        var result = await _dashboardService.GetManagerDashboardAsync(userId, isAdmin, cancellationToken);
        return Ok(ApiResponse<ManagerDashboardDto>.SuccessResponse(result));
    }
}
