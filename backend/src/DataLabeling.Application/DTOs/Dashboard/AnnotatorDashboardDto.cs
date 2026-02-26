namespace DataLabeling.Application.DTOs.Dashboard;

/// <summary>
/// Annotator dashboard response DTO.
/// </summary>
public class AnnotatorDashboardDto
{
    /// <summary>
    /// Annotator statistics.
    /// </summary>
    public AnnotatorStatsDto Stats { get; set; } = new();

    /// <summary>
    /// Recent tasks assigned to the annotator.
    /// </summary>
    public List<RecentTaskDto> RecentTasks { get; set; } = new();

    /// <summary>
    /// Recent notifications for the annotator.
    /// </summary>
    public List<NotificationDto> Notifications { get; set; } = new();
}
