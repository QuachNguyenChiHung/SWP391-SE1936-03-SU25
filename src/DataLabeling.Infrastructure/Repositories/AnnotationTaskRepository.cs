using Microsoft.EntityFrameworkCore;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Interfaces.Repositories;
using DataLabeling.Infrastructure.Data;

namespace DataLabeling.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for AnnotationTask entity.
/// </summary>
public class AnnotationTaskRepository : Repository<AnnotationTask>, IAnnotationTaskRepository
{
    public AnnotationTaskRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<AnnotationTask>> GetByAnnotatorIdAsync(int annotatorId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(t => t.AnnotatorId == annotatorId)
            .Include(t => t.Project)
            .OrderByDescending(t => t.AssignedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<AnnotationTask>> GetByProjectIdAsync(int projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(t => t.ProjectId == projectId)
            .Include(t => t.Annotator)
            .Include(t => t.AssignedBy)
            .OrderByDescending(t => t.AssignedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<AnnotationTask>> GetByStatusAsync(AnnotationTaskStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(t => t.Status == status)
            .Include(t => t.Project)
            .Include(t => t.Annotator)
            .ToListAsync(cancellationToken);
    }

    public async Task<AnnotationTask?> GetWithDetailsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(t => t.Project)
            .Include(t => t.Annotator)
            .Include(t => t.AssignedBy)
            .Include(t => t.TaskItems)
                .ThenInclude(ti => ti.DataItem)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<AnnotationTask?> GetWithTaskItemsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(t => t.TaskItems)
                .ThenInclude(ti => ti.DataItem)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<(IEnumerable<AnnotationTask> Items, int TotalCount)> GetPagedAsync(
        int pageNumber,
        int pageSize,
        int? projectId = null,
        int? annotatorId = null,
        AnnotationTaskStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet.AsQueryable();

        if (projectId.HasValue)
            query = query.Where(t => t.ProjectId == projectId.Value);

        if (annotatorId.HasValue)
            query = query.Where(t => t.AnnotatorId == annotatorId.Value);

        if (status.HasValue)
            query = query.Where(t => t.Status == status.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Include(t => t.Project)
            .Include(t => t.Annotator)
            .OrderByDescending(t => t.AssignedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task UpdateProgressAsync(int taskId, CancellationToken cancellationToken = default)
    {
        var task = await _dbSet
            .Include(t => t.TaskItems)
            .FirstOrDefaultAsync(t => t.Id == taskId, cancellationToken);

        if (task != null)
        {
            task.TotalItems = task.TaskItems.Count;
            task.CompletedItems = task.TaskItems.Count(ti => ti.Status == TaskItemStatus.Completed);
            task.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
