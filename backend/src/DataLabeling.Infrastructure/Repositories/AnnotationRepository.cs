using Microsoft.EntityFrameworkCore;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Interfaces.Repositories;
using DataLabeling.Infrastructure.Data;

namespace DataLabeling.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Annotation entity.
/// </summary>
public class AnnotationRepository : Repository<Annotation>, IAnnotationRepository
{
    public AnnotationRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Annotation>> GetByDataItemIdAsync(int dataItemId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(a => a.DataItemId == dataItemId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Annotation>> GetByDataItemIdWithLabelAsync(int dataItemId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(a => a.DataItemId == dataItemId)
            .Include(a => a.Label)
            .Include(a => a.CreatedBy)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Annotation>> GetByCreatorIdAsync(int creatorId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(a => a.CreatedById == creatorId)
            .Include(a => a.Label)
            .Include(a => a.DataItem)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Annotation>> GetByLabelIdAsync(int labelId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(a => a.LabelId == labelId)
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteByDataItemIdAsync(int dataItemId, CancellationToken cancellationToken = default)
    {
        await _dbSet
            .Where(a => a.DataItemId == dataItemId)
            .ExecuteDeleteAsync(cancellationToken);
    }

    public async Task<Dictionary<int, int>> GetCountByLabelAsync(int projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(a => a.Label.ProjectId == projectId)
            .GroupBy(a => a.LabelId)
            .Select(g => new { LabelId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.LabelId, x => x.Count, cancellationToken);
    }
}
