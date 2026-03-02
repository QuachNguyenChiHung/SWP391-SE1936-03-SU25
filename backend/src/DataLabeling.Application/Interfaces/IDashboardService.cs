using DataLabeling.Application.DTOs.Dashboard;

namespace DataLabeling.Application.Interfaces;

public interface IDashboardService
{
    Task<AnnotatorDashboardDto> GetAnnotatorDashboardAsync(int userId, CancellationToken ct);
    Task<ReviewerDashboardDto> GetReviewerDashboardAsync(int userId, CancellationToken ct);
    Task<ManagerDashboardDto> GetManagerDashboardAsync(int userId, bool isAdmin, CancellationToken ct);
}
