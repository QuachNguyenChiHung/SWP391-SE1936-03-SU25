namespace DataLabeling.Application.DTOs.Dashboard;

/// <summary>
/// Manager dashboard response DTO.
/// </summary>
public class ManagerDashboardDto
{
    /// <summary>
    /// Manager statistics.
    /// </summary>
    public ManagerStatsDto Stats { get; set; } = new();

    /// <summary>
    /// Overview of all projects.
    /// </summary>
    public List<ProjectOverviewDto> ProjectOverview { get; set; } = new();

    /// <summary>
    /// Team performance metrics.
    /// </summary>
    public List<TeamPerformanceDto> TeamPerformance { get; set; } = new();
}
