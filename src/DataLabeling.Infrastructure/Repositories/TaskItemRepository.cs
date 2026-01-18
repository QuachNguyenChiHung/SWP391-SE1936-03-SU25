using Microsoft.EntityFrameworkCore;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Interfaces.Repositories;
using DataLabeling.Infrastructure.Data;

namespace DataLabeling.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for TaskItem entity.
/// </summary>
public class TaskItemRepository : Repository<TaskItem>, ITaskItemRepository
{
    public TaskItemRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<TaskItem>> GetByTaskIdAsync(int taskId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(ti => ti.TaskId == taskId)
            .Include(ti => ti.DataItem)
            .OrderBy(ti => ti.DataItem.FileName)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<TaskItem>> GetByDataItemIdAsync(int dataItemId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(ti => ti.DataItemId == dataItemId)
            .Include(ti => ti.Task)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<TaskItem>> GetByTaskIdAndStatusAsync(int taskId, TaskItemStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(ti => ti.TaskId == taskId && ti.Status == status)
            .Include(ti => ti.DataItem)
            .ToListAsync(cancellationToken);
    }

    public async Task<TaskItem?> GetWithDataItemAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(ti => ti.DataItem)
            .FirstOrDefaultAsync(ti => ti.Id == id, cancellationToken);
    }

    public async Task<bool> IsDataItemInTaskAsync(int taskId, int dataItemId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(ti => ti.TaskId == taskId && ti.DataItemId == dataItemId, cancellationToken);
    }

    public async Task<int> GetCompletedCountAsync(int taskId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .CountAsync(ti => ti.TaskId == taskId && ti.Status == TaskItemStatus.Completed, cancellationToken);
    }
}
