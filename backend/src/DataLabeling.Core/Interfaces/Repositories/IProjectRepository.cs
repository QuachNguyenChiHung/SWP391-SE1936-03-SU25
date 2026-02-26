using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for Project entity operations.
/// </summary>
public interface IProjectRepository : IRepository<Project>
{
    /// <summary>
    /// Gets a project with all related details (Dataset, Guideline, Labels).
    /// </summary>
    Task<Project?> GetWithDetailsAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all projects created by a specific user.
    /// </summary>
    Task<IEnumerable<Project>> GetByCreatorIdAsync(int creatorId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all projects with the specified status.
    /// </summary>
    Task<IEnumerable<Project>> GetByStatusAsync(ProjectStatus status, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets projects with pagination and optional filtering.
    /// </summary>
    Task<(IEnumerable<Project> Items, int TotalCount)> GetPagedAsync(
        int pageNumber,
        int pageSize,
        ProjectStatus? status = null,
        int? creatorId = null,
        string? searchTerm = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets projects with upcoming deadlines.
    /// </summary>
    Task<IEnumerable<Project>> GetWithUpcomingDeadlineAsync(int daysAhead, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets project statistics (item counts by status).
    /// </summary>
    Task<ProjectStatistics?> GetStatisticsAsync(int projectId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Project statistics DTO.
/// </summary>
public class ProjectStatistics
{
    public int TotalItems { get; set; }
    public int PendingItems { get; set; }
    public int AssignedItems { get; set; }
    public int InProgressItems { get; set; }
    public int SubmittedItems { get; set; }
    public int ApprovedItems { get; set; }
    public int RejectedItems { get; set; }
}
