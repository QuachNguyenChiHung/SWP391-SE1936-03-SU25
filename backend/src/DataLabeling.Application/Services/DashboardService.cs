using DataLabeling.Application.DTOs.Dashboard;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Interfaces;

namespace DataLabeling.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _uow;

    public DashboardService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<AnnotatorDashboardDto> GetAnnotatorDashboardAsync(int userId, CancellationToken ct)
    {
        var tasks = await _uow.AnnotationTasks.GetByAnnotatorIdAsync(userId, ct);
        var taskList = tasks?.ToList() ?? new List<Core.Entities.AnnotationTask>();

        var stats = new AnnotatorStatsDto
        {
            TotalAssigned = taskList.Count,
            InProgress = taskList.Count(t => t.Status == AnnotationTaskStatus.InProgress),
            Completed = taskList.Count(t => t.Status == AnnotationTaskStatus.Completed),
            PendingReview = taskList.Count(t => t.Status == AnnotationTaskStatus.Submitted)
        };

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

        var (notifications, _) = await _uow.Notifications.GetPagedByUserIdAsync(
            userId, 1, 5, false, ct);

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

        return new AnnotatorDashboardDto
        {
            Stats = stats,
            RecentTasks = recentTasks,
            Notifications = notificationDtos
        };
    }

    public async Task<ReviewerDashboardDto> GetReviewerDashboardAsync(int userId, CancellationToken ct)
    {
        var reviewerStats = await _uow.Reviews.GetReviewerStatisticsAsync(userId, ct);

        var (pendingItems, pendingCount) = await _uow.Reviews.GetPendingReviewItemsPagedAsync(
            1, 10, userId, null, ct);

        var pendingQueue = (pendingItems ?? Enumerable.Empty<Core.Entities.DataItem>())
            .Select(item => new DashboardPendingReviewItemDto
            {
                DataItemId = item.Id,
                FileName = item.FileName ?? "Unknown",
                ProjectName = item.Dataset?.Project?.Name ?? "Unknown",
                AnnotatorName = item.TaskItems?.FirstOrDefault()?.Task?.Annotator?.Name ?? "Unknown",
                SubmittedAt = item.UpdatedAt ?? item.CreatedAt
            }).ToList();

        var allReviewsByUser = (await _uow.Reviews.GetByReviewerIdAsync(userId, ct))?.ToList()
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

        var today = DateTime.UtcNow.Date;
        var reviewsToday = allReviewsByUser.Count(r => r.CreatedAt.Date == today);

        var stats = new DashboardReviewerStatsDto
        {
            PendingReview = pendingCount,
            ReviewedToday = reviewsToday,
            TotalReviewed = reviewerStats?.TotalReviewed ?? 0,
            ApprovalRate = reviewerStats?.ApprovalRate ?? 0
        };

        return new ReviewerDashboardDto
        {
            Stats = stats,
            PendingQueue = pendingQueue,
            RecentReviews = recentReviews
        };
    }

    public async Task<ManagerDashboardDto> GetManagerDashboardAsync(int userId, bool isAdmin, CancellationToken ct)
    {
        var (projects, totalProjects) = await _uow.Projects.GetPagedAsync(
            1, 100, null, isAdmin ? null : userId, null, ct);

        var projectList = projects?.ToList() ?? new List<Core.Entities.Project>();

        int totalItems = 0;
        int completedItems = 0;
        var projectOverviews = new List<ProjectOverviewDto>();

        foreach (var project in projectList)
        {
            // Fix N+1: compute stats from already-loaded Dataset.DataItems
            var dataItems = project.Dataset?.DataItems;
            var projectTotalItems = dataItems?.Count ?? 0;
            var projectCompletedItems = dataItems?.Count(d => d.Status == DataItemStatus.Approved) ?? 0;

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

        var annotatorPerformance = await _uow.AnnotationTasks.GetAnnotatorPerformanceAsync(10, ct);

        var tasksByAnnotator = annotatorPerformance.Select(a => new TeamPerformanceDto
        {
            UserId = a.AnnotatorId,
            UserName = a.AnnotatorName,
            Role = "Annotator",
            TasksCompleted = a.TasksCompleted,
            ItemsProcessed = a.ItemsProcessed,
            AverageAccuracy = 0
        }).ToList();

        return new ManagerDashboardDto
        {
            Stats = managerStats,
            ProjectOverview = projectOverviews.Take(10).ToList(),
            TeamPerformance = tasksByAnnotator
        };
    }
}
