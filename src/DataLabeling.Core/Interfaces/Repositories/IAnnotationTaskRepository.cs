using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for AnnotationTask entity operations.
/// </summary>
public interface IAnnotationTaskRepository : IRepository<AnnotationTask>
{
    /// <summary>
    /// Gets all tasks assigned to a specific annotator.
    /// </summary>
    Task<IEnumerable<AnnotationTask>> GetByAnnotatorIdAsync(int annotatorId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all tasks for a specific project.
    /// </summary>
    Task<IEnumerable<AnnotationTask>> GetByProjectIdAsync(int projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all tasks with a specific status.
    /// </summary>
    Task<IEnumerable<AnnotationTask>> GetByStatusAsync(AnnotationTaskStatus status, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets task with all details (Project, Annotator, TaskItems).
    /// </summary>
    Task<AnnotationTask?> GetWithDetailsAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets task with its task items.
    /// </summary>
    Task<AnnotationTask?> GetWithTaskItemsAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets tasks with pagination and optional filtering.
    /// </summary>
    Task<(IEnumerable<AnnotationTask> Items, int TotalCount)> GetPagedAsync(
        int pageNumber,
        int pageSize,
        int? projectId = null,
        int? annotatorId = null,
        AnnotationTaskStatus? status = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates task progress counters.
    /// </summary>
    Task UpdateProgressAsync(int taskId, CancellationToken cancellationToken = default);
}
