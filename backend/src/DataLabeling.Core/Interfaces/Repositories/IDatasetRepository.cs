using DataLabeling.Core.Entities;

namespace DataLabeling.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for Dataset entity operations.
/// </summary>
public interface IDatasetRepository : IRepository<Dataset>
{
    /// <summary>
    /// Gets the dataset for a specific project.
    /// </summary>
    Task<Dataset?> GetByProjectIdAsync(int projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the dataset with all its data items.
    /// </summary>
    Task<Dataset?> GetWithDataItemsAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates the dataset statistics (TotalItems, TotalSizeMB).
    /// </summary>
    Task UpdateStatisticsAsync(int datasetId, CancellationToken cancellationToken = default);
}
