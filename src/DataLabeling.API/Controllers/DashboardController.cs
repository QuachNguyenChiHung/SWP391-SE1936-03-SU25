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
    [ProducesResponseType(typeof(AnnotatorDashboardDto), 200)]
    public async Task<ActionResult<AnnotatorDashboardDto>> GetAnnotatorDashboard(CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();

        // Get all tasks assigned to this annotator
        var tasks = await _uow.AnnotationTasks.GetByAnnotatorIdAsync(userId, cancellationToken);
        var taskList = tasks.ToList();

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
                ProgressPercent = t.ProgressPercent,
                AssignedAt = t.AssignedAt
            })
            .ToList();

        // Get recent notifications (last 5)
        var (notifications, _) = await _uow.Notifications.GetPagedByUserIdAsync(
            userId, 1, 5, false, cancellationToken);

        var notificationDtos = notifications.Select(n => new NotificationDto
        {
            Id = n.Id,
            Type = n.Type.ToString(),
            Title = n.Title,
            Content = n.Content,
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt
        }).ToList();

        return Ok(new AnnotatorDashboardDto
        {
            Stats = stats,
            RecentTasks = recentTasks,
            Notifications = notificationDtos
        });
    }

    /// <summary>
    /// Get reviewer dashboard data.
    /// </summary>
    [HttpGet("reviewer")]
    [Authorize(Roles = "Reviewer")]
    [ProducesResponseType(typeof(ReviewerDashboardDto), 200)]
    public async Task<ActionResult<ReviewerDashboardDto>> GetReviewerDashboard(CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();

        // Get reviewer statistics
        var reviewerStats = await _uow.Reviews.GetReviewerStatisticsAsync(userId, cancellationToken);

        // Get pending review items (first 10)
        var (pendingItems, pendingCount) = await _uow.Reviews.GetPendingReviewItemsPagedAsync(
            1, 10, null, cancellationToken);

        var pendingQueue = pendingItems.Select(item => new PendingReviewItemDto
        {
            DataItemId = item.Id,
            FileName = item.FileName,
            ProjectName = item.Dataset?.Project?.Name ?? "Unknown",
            AnnotatorName = item.TaskItems.FirstOrDefault()?.Task?.Annotator?.Name ?? "Unknown",
            SubmittedAt = item.UpdatedAt ?? item.CreatedAt
        }).ToList();

        // Get recent reviews by this reviewer (last 5)
        var recentReviews = (await _uow.Reviews.GetByReviewerIdAsync(userId, cancellationToken))
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

        // Count reviews done today
        var today = DateTime.UtcNow.Date;
        var reviewsToday = (await _uow.Reviews.GetByReviewerIdAsync(userId, cancellationToken))
            .Count(r => r.CreatedAt.Date == today);

        var stats = new ReviewerStatsDto
        {
            PendingReview = pendingCount,
            ReviewedToday = reviewsToday,
            TotalReviewed = reviewerStats.TotalReviewed,
            ApprovalRate = reviewerStats.ApprovalRate
        };

        return Ok(new ReviewerDashboardDto
        {
            Stats = stats,
            PendingQueue = pendingQueue,
            RecentReviews = recentReviews
        });
    }

    /// <summary>
    /// Get manager dashboard data.
    /// </summary>
    [HttpGet("manager")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ManagerDashboardDto), 200)]
    public async Task<ActionResult<ManagerDashboardDto>> GetManagerDashboard(CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var isAdmin = userRole == UserRole.Admin.ToString();

        // Get projects (Admin sees all, Manager sees their own)
        var (projects, totalProjects) = await _uow.Projects.GetPagedAsync(
            1, 100, null, isAdmin ? null : userId, null, cancellationToken);

        var projectList = projects.ToList();

        // Calculate stats
        int totalItems = 0;
        int completedItems = 0;
        var projectOverviews = new List<ProjectOverviewDto>();

        foreach (var project in projectList)
        {
            var stats = await _uow.Projects.GetStatisticsAsync(project.Id, cancellationToken);
            var projectTotalItems = stats?.TotalItems ?? 0;
            var projectCompletedItems = stats?.ApprovedItems ?? 0;

            totalItems += projectTotalItems;
            completedItems += projectCompletedItems;

            projectOverviews.Add(new ProjectOverviewDto
            {
                ProjectId = project.Id,
                ProjectName = project.Name,
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
        var teamPerformance = new List<TeamPerformanceDto>();

        // Get all tasks to aggregate team performance
        var allTasks = await _uow.AnnotationTasks.GetPagedAsync(1, 1000, null, null, null, cancellationToken);
        var tasksByAnnotator = allTasks.Items
            .GroupBy(t => new { t.AnnotatorId, t.Annotator?.Name })
            .Select(g => new TeamPerformanceDto
            {
                UserId = g.Key.AnnotatorId,
                UserName = g.Key.Name ?? "Unknown",
                Role = "Annotator",
                TasksCompleted = g.Count(t => t.Status == AnnotationTaskStatus.Completed),
                ItemsProcessed = g.Sum(t => t.CompletedItems),
                AverageAccuracy = 0 // Would need review data to calculate
            })
            .Take(10)
            .ToList();

        return Ok(new ManagerDashboardDto
        {
            Stats = managerStats,
            ProjectOverview = projectOverviews.Take(10).ToList(),
            TeamPerformance = tasksByAnnotator
        });
    }
}
