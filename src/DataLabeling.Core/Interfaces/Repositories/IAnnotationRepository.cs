using DataLabeling.Core.Entities;

namespace DataLabeling.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for Annotation entity operations.
/// </summary>
public interface IAnnotationRepository : IRepository<Annotation>
{
    /// <summary>
    /// Gets all annotations for a specific data item.
    /// </summary>
    Task<IEnumerable<Annotation>> GetByDataItemIdAsync(int dataItemId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all annotations for a specific data item with label details.
    /// </summary>
    Task<IEnumerable<Annotation>> GetByDataItemIdWithLabelAsync(int dataItemId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all annotations created by a specific user.
    /// </summary>
    Task<IEnumerable<Annotation>> GetByCreatorIdAsync(int creatorId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all annotations using a specific label.
    /// </summary>
    Task<IEnumerable<Annotation>> GetByLabelIdAsync(int labelId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes all annotations for a specific data item.
    /// </summary>
    Task DeleteByDataItemIdAsync(int dataItemId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets annotation count by label for a project.
    /// </summary>
    Task<Dictionary<int, int>> GetCountByLabelAsync(int projectId, CancellationToken cancellationToken = default);
}
