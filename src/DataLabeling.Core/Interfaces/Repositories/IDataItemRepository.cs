using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for DataItem entity operations.
/// </summary>
public interface IDataItemRepository : IRepository<DataItem>
{
    /// <summary>
    /// Gets all data items for a specific dataset.
    /// </summary>
    Task<IEnumerable<DataItem>> GetByDatasetIdAsync(int datasetId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all data items with the specified status.
    /// </summary>
    Task<IEnumerable<DataItem>> GetByStatusAsync(DataItemStatus status, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets data items for a dataset with a specific status.
    /// </summary>
    Task<IEnumerable<DataItem>> GetByDatasetAndStatusAsync(int datasetId, DataItemStatus status, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets unassigned (Pending) data items for a dataset.
    /// </summary>
    Task<IEnumerable<DataItem>> GetUnassignedByDatasetIdAsync(int datasetId, int count, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets data item with annotations and reviews.
    /// </summary>
    Task<DataItem?> GetWithDetailsAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets data items with pagination and optional filtering.
    /// </summary>
    Task<(IEnumerable<DataItem> Items, int TotalCount)> GetPagedAsync(
        int datasetId,
        int pageNumber,
        int pageSize,
        DataItemStatus? status = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Bulk update status for multiple data items.
    /// </summary>
    Task BulkUpdateStatusAsync(IEnumerable<int> ids, DataItemStatus status, CancellationToken cancellationToken = default);
}
