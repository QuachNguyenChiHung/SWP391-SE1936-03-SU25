using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.DataItems;
using DataLabeling.Core.Enums;
using Microsoft.AspNetCore.Http;

namespace DataLabeling.Application.Interfaces;

/// <summary>
/// Service interface for DataItem and Dataset operations.
/// </summary>
public interface IDataItemService
{
    // Dataset operations

    /// <summary>
    /// Gets or creates a dataset for the specified project.
    /// </summary>
    Task<DatasetDto> GetOrCreateDatasetAsync(int projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the dataset for a project if it exists.
    /// </summary>
    Task<DatasetDto?> GetDatasetByProjectIdAsync(int projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a dataset and all its data items.
    /// </summary>
    Task DeleteDatasetAsync(int projectId, CancellationToken cancellationToken = default);

    // Upload operations

    /// <summary>
    /// Uploads files to a project's dataset.
    /// </summary>
    Task<UploadResultDto> UploadFilesAsync(int projectId, IFormFileCollection files, CancellationToken cancellationToken = default);

    // Query operations

    /// <summary>
    /// Gets paginated data items for a project.
    /// </summary>
    Task<PagedResult<DataItemDto>> GetDataItemsAsync(
        int projectId,
        int pageNumber,
        int pageSize,
        DataItemStatus? status = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets detailed information for a specific data item.
    /// </summary>
    Task<DataItemDetailDto?> GetDataItemDetailAsync(int dataItemId, CancellationToken cancellationToken = default);

    // Status management

    /// <summary>
    /// Updates the status of a single data item.
    /// </summary>
    Task UpdateStatusAsync(int dataItemId, DataItemStatus status, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates the status of multiple data items.
    /// </summary>
    Task BulkUpdateStatusAsync(int[] ids, DataItemStatus status, CancellationToken cancellationToken = default);

    // Delete operations

    /// <summary>
    /// Deletes a single data item.
    /// </summary>
    Task DeleteDataItemAsync(int dataItemId, CancellationToken cancellationToken = default);
}
