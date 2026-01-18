using DataLabeling.Core.Entities;

namespace DataLabeling.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for Label entity operations.
/// </summary>
public interface ILabelRepository : IRepository<Label>
{
    /// <summary>
    /// Gets all labels for a specific project.
    /// </summary>
    Task<IEnumerable<Label>> GetByProjectIdAsync(int projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets labels for a project ordered by DisplayOrder.
    /// </summary>
    Task<IEnumerable<Label>> GetByProjectIdOrderedAsync(int projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a label name exists in a project.
    /// </summary>
    Task<bool> NameExistsInProjectAsync(int projectId, string name, int? excludeId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a shortcut exists in a project.
    /// </summary>
    Task<bool> ShortcutExistsInProjectAsync(int projectId, char shortcut, int? excludeId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the next display order for a project.
    /// </summary>
    Task<int> GetNextDisplayOrderAsync(int projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a label has any annotations.
    /// </summary>
    Task<bool> HasAnnotationsAsync(int labelId, CancellationToken cancellationToken = default);
}
