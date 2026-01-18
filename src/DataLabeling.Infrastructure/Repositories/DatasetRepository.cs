using Microsoft.EntityFrameworkCore;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Interfaces.Repositories;
using DataLabeling.Infrastructure.Data;

namespace DataLabeling.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Dataset entity.
/// </summary>
public class DatasetRepository : Repository<Dataset>, IDatasetRepository
{
    public DatasetRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Dataset?> GetByProjectIdAsync(int projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(d => d.ProjectId == projectId, cancellationToken);
    }

    public async Task<Dataset?> GetWithDataItemsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(d => d.DataItems)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
    }

    public async Task UpdateStatisticsAsync(int datasetId, CancellationToken cancellationToken = default)
    {
        var dataset = await _dbSet
            .Include(d => d.DataItems)
            .FirstOrDefaultAsync(d => d.Id == datasetId, cancellationToken);

        if (dataset != null)
        {
            dataset.TotalItems = dataset.DataItems.Count;
            dataset.TotalSizeMB = dataset.DataItems
                .Where(d => d.FileSizeKB.HasValue)
                .Sum(d => d.FileSizeKB!.Value) / 1024m;
            dataset.UpdatedAt = DateTime.UtcNow;
        }
    }
}
