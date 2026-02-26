using Microsoft.EntityFrameworkCore;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Interfaces.Repositories;
using DataLabeling.Infrastructure.Data;

namespace DataLabeling.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for DataItem entity.
/// </summary>
public class DataItemRepository : Repository<DataItem>, IDataItemRepository
{
    public DataItemRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<DataItem>> GetByDatasetIdAsync(int datasetId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(d => d.DatasetId == datasetId)
            .OrderBy(d => d.FileName)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<DataItem>> GetByStatusAsync(DataItemStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(d => d.Status == status)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<DataItem>> GetByDatasetAndStatusAsync(int datasetId, DataItemStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(d => d.DatasetId == datasetId && d.Status == status)
            .OrderBy(d => d.FileName)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<DataItem>> GetUnassignedByDatasetIdAsync(int datasetId, int count, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(d => d.DatasetId == datasetId && d.Status == DataItemStatus.Pending)
            .OrderBy(d => d.Id)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public async Task<DataItem?> GetWithDetailsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(d => d.Annotations)
                .ThenInclude(a => a.Label)
            .Include(d => d.Annotations)
                .ThenInclude(a => a.CreatedBy)
            .Include(d => d.Reviews.OrderByDescending(r => r.CreatedAt))
                .ThenInclude(r => r.Reviewer)
            .Include(d => d.Reviews)
                .ThenInclude(r => r.ReviewErrorTypes)
                    .ThenInclude(ret => ret.ErrorType)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
    }

    public async Task<(IEnumerable<DataItem> Items, int TotalCount)> GetPagedAsync(
        int datasetId,
        int pageNumber,
        int pageSize,
        DataItemStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Where(d => d.DatasetId == datasetId);

        if (status.HasValue)
            query = query.Where(d => d.Status == status.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(d => d.FileName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task BulkUpdateStatusAsync(IEnumerable<int> ids, DataItemStatus status, CancellationToken cancellationToken = default)
    {
        var idList = ids.ToList();

        await _dbSet
            .Where(d => idList.Contains(d.Id))
            .ExecuteUpdateAsync(s => s
                .SetProperty(d => d.Status, status)
                .SetProperty(d => d.UpdatedAt, DateTime.UtcNow),
                cancellationToken);
    }
}
