using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Dashboard;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DataLabeling.API.Controllers;

/// <summary>
/// Controller for dashboard data for different user roles.
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public DashboardController(IUnitOfWork uow)
    {
        _uow = uow;
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

    /// <summary>
    /// Get annotator dashboard data.
    /// </summary>
    [HttpGet("annotator")]
    [Authorize(Roles = "Annotator")]
    [ProducesResponseType(typeof(ApiResponse<AnnotatorDashboardDto>), 200)]
    public async Task<ActionResult<ApiResponse<AnnotatorDashboardDto>>> GetAnnotatorDashboard(CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();

        // Get all tasks assigned to this annotator
        var tasks = await _uow.AnnotationTasks.GetByAnnotatorIdAsync(userId, cancellationToken);
        var taskList = tasks?.ToList() ?? new List<Core.Entities.AnnotationTask>();

        // Calculate stats
        var stats = new AnnotatorStatsDto
        {
            TotalAssigned = taskList.Count,
            InProgress = taskList.Count(t => t.Status == AnnotationTaskStatus.InProgress),
            Completed = taskList.Count(t => t.Status == AnnotationTaskStatus.Completed),
            PendingReview = taskList.Count(t => t.Status == AnnotationTaskStatus.Submitted)
        };

        // Get recent tasks (last 5)
        var recentTasks = taskList
            .OrderByDescending(t => t.AssignedAt)
            .Take(5)
            .Select(t => new RecentTaskDto
            {
                TaskId = t.Id,
                ProjectName = t.Project?.Name ?? "Unknown",
                Status = t.Status.ToString(),
                TotalItems = t.TotalItems,
                CompletedItems = t.CompletedItems,
                ProgressPercent = t.TotalItems > 0 ? (double)t.CompletedItems / t.TotalItems * 100 : 0,
                AssignedAt = t.AssignedAt
            })
            .ToList();

        // Get recent notifications (last 5)
        var (notifications, _) = await _uow.Notifications.GetPagedByUserIdAsync(
            userId, 1, 5, false, cancellationToken);

        var notificationDtos = (notifications ?? Enumerable.Empty<Core.Entities.Notification>())
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Type = n.Type.ToString(),
                Title = n.Title,
                Content = n.Content,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            }).ToList();

        var result = new AnnotatorDashboardDto
        {
            Stats = stats,
            RecentTasks = recentTasks,
            Notifications = notificationDtos
        };

        return Ok(ApiResponse<AnnotatorDashboardDto>.SuccessResponse(result));
    }

    /// <summary>
    /// Get reviewer dashboard data.
    /// </summary>
    [HttpGet("reviewer")]
    [Authorize(Roles = "Reviewer")]
    [ProducesResponseType(typeof(ApiResponse<ReviewerDashboardDto>), 200)]
    public async Task<ActionResult<ApiResponse<ReviewerDashboardDto>>> GetReviewerDashboard(CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();

        // Get reviewer statistics
        var reviewerStats = await _uow.Reviews.GetReviewerStatisticsAsync(userId, cancellationToken);

        // Get pending review items (first 10)
        var (pendingItems, pendingCount) = await _uow.Reviews.GetPendingReviewItemsPagedAsync(
            1, 10, null, cancellationToken);

        var pendingQueue = (pendingItems ?? Enumerable.Empty<Core.Entities.DataItem>())
            .Select(item => new PendingReviewItemDto
            {
                DataItemId = item.Id,
                FileName = item.FileName ?? "Unknown",
                ProjectName = item.Dataset?.Project?.Name ?? "Unknown",
                AnnotatorName = item.TaskItems?.FirstOrDefault()?.Task?.Annotator?.Name ?? "Unknown",
                SubmittedAt = item.UpdatedAt ?? item.CreatedAt
            }).ToList();

        // Get recent reviews by this reviewer (last 5) - single query for both recent reviews and today count
        var allReviewsByUser = (await _uow.Reviews.GetByReviewerIdAsync(userId, cancellationToken))?.ToList()
            ?? new List<Core.Entities.Review>();

        var recentReviews = allReviewsByUser
            .OrderByDescending(r => r.CreatedAt)
            .Take(5)
            .Select(r => new RecentReviewDto
            {
                ReviewId = r.Id,
                FileName = r.DataItem?.FileName ?? "Unknown",
                Decision = r.Decision.ToString(),
                ReviewedAt = r.CreatedAt
            })
            .ToList();

        // Count reviews done today (reuse the same list)
        var today = DateTime.UtcNow.Date;
        var reviewsToday = allReviewsByUser.Count(r => r.CreatedAt.Date == today);

        var stats = new ReviewerStatsDto
        {
            PendingReview = pendingCount,
            ReviewedToday = reviewsToday,
            TotalReviewed = reviewerStats?.TotalReviewed ?? 0,
            ApprovalRate = reviewerStats?.ApprovalRate ?? 0
        };

        var result = new ReviewerDashboardDto
        {
            Stats = stats,
            PendingQueue = pendingQueue,
            RecentReviews = recentReviews
        };

        return Ok(ApiResponse<ReviewerDashboardDto>.SuccessResponse(result));
    }

    /// <summary>
    /// Get manager dashboard data.
    /// </summary>
    [HttpGet("manager")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse<ManagerDashboardDto>), 200)]
    public async Task<ActionResult<ApiResponse<ManagerDashboardDto>>> GetManagerDashboard(CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var isAdmin = userRole == UserRole.Admin.ToString();

        // Get projects (Admin sees all, Manager sees their own)
        var (projects, totalProjects) = await _uow.Projects.GetPagedAsync(
            1, 100, null, isAdmin ? null : userId, null, cancellationToken);

        var projectList = projects?.ToList() ?? new List<Core.Entities.Project>();

        // Calculate stats
        int totalItems = 0;
        int completedItems = 0;
        var projectOverviews = new List<ProjectOverviewDto>();

        foreach (var project in projectList)
        {
            var projectStats = await _uow.Projects.GetStatisticsAsync(project.Id, cancellationToken);
            var projectTotalItems = projectStats?.TotalItems ?? 0;
            var projectCompletedItems = projectStats?.ApprovedItems ?? 0;

            totalItems += projectTotalItems;
            completedItems += projectCompletedItems;

            projectOverviews.Add(new ProjectOverviewDto
            {
                ProjectId = project.Id,
                ProjectName = project.Name ?? "Unknown",
                Status = project.Status.ToString(),
                TotalItems = projectTotalItems,
                CompletedItems = projectCompletedItems,
                ProgressPercent = projectTotalItems > 0 ? (double)projectCompletedItems / projectTotalItems * 100 : 0,
                Deadline = project.Deadline
            });
        }

        var managerStats = new ManagerStatsDto
        {
            TotalProjects = totalProjects,
            ActiveProjects = projectList.Count(p => p.Status == ProjectStatus.Active),
            TotalItems = totalItems,
            CompletionRate = totalItems > 0 ? (double)completedItems / totalItems * 100 : 0
        };

        // Get team performance (simplified - just get annotators with their task counts)
        var allTasks = await _uow.AnnotationTasks.GetPagedAsync(1, 1000, null, null, null, cancellationToken);
        var taskItems = allTasks.Items?.ToList() ?? new List<Core.Entities.AnnotationTask>();

        var tasksByAnnotator = taskItems
            .GroupBy(t => t.AnnotatorId)
            .Select(g =>
            {
                var firstTask = g.First();
                return new TeamPerformanceDto
                {
                    UserId = g.Key,
                    UserName = firstTask.Annotator?.Name ?? "Unknown",
                    Role = "Annotator",
                    TasksCompleted = g.Count(t => t.Status == AnnotationTaskStatus.Completed),
                    ItemsProcessed = g.Sum(t => t.CompletedItems),
                    AverageAccuracy = 0 // Would need review data to calculate
                };
            })
            .Take(10)
            .ToList();

        var result = new ManagerDashboardDto
        {
            Stats = managerStats,
            ProjectOverview = projectOverviews.Take(10).ToList(),
            TeamPerformance = tasksByAnnotator
        };

        return Ok(ApiResponse<ManagerDashboardDto>.SuccessResponse(result));
    }
}
