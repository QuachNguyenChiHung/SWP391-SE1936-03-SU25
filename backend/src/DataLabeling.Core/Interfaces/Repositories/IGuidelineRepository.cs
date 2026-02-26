using DataLabeling.Core.Entities;

namespace DataLabeling.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for Guideline entity operations.
/// </summary>
public interface IGuidelineRepository : IRepository<Guideline>
{
    /// <summary>
    /// Gets the guideline for a specific project.
    /// </summary>
    Task<Guideline?> GetByProjectIdAsync(int projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Increments the version number and updates content.
    /// </summary>
    Task UpdateContentAsync(int projectId, string content, CancellationToken cancellationToken = default);
}
