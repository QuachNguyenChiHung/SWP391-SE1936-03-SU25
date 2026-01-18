using Microsoft.EntityFrameworkCore;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Interfaces.Repositories;
using DataLabeling.Infrastructure.Data;

namespace DataLabeling.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Label entity.
/// </summary>
public class LabelRepository : Repository<Label>, ILabelRepository
{
    public LabelRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Label>> GetByProjectIdAsync(int projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(l => l.ProjectId == projectId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Label>> GetByProjectIdOrderedAsync(int projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(l => l.ProjectId == projectId)
            .OrderBy(l => l.DisplayOrder)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> NameExistsInProjectAsync(int projectId, string name, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Where(l => l.ProjectId == projectId && l.Name.ToLower() == name.ToLower());

        if (excludeId.HasValue)
            query = query.Where(l => l.Id != excludeId.Value);

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<bool> ShortcutExistsInProjectAsync(int projectId, char shortcut, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Where(l => l.ProjectId == projectId && l.Shortcut == shortcut);

        if (excludeId.HasValue)
            query = query.Where(l => l.Id != excludeId.Value);

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<int> GetNextDisplayOrderAsync(int projectId, CancellationToken cancellationToken = default)
    {
        var maxOrder = await _dbSet
            .Where(l => l.ProjectId == projectId)
            .MaxAsync(l => (int?)l.DisplayOrder, cancellationToken);

        return (maxOrder ?? 0) + 1;
    }

    public async Task<bool> HasAnnotationsAsync(int labelId, CancellationToken cancellationToken = default)
    {
        return await _context.Annotations
            .AnyAsync(a => a.LabelId == labelId, cancellationToken);
    }
}
