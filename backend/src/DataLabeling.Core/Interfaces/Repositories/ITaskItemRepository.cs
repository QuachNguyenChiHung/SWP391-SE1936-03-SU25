using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for TaskItem entity operations.
/// </summary>
public interface ITaskItemRepository : IRepository<TaskItem>
{
    /// <summary>
    /// Gets all task items for a specific task.
    /// </summary>
    Task<IEnumerable<TaskItem>> GetByTaskIdAsync(int taskId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all task items for a specific data item.
    /// </summary>
    Task<IEnumerable<TaskItem>> GetByDataItemIdAsync(int dataItemId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets task items for a task with a specific status.
    /// </summary>
    Task<IEnumerable<TaskItem>> GetByTaskIdAndStatusAsync(int taskId, TaskItemStatus status, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets task item with data item details.
    /// </summary>
    Task<TaskItem?> GetWithDataItemAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a data item is already assigned to a task.
    /// </summary>
    Task<bool> IsDataItemInTaskAsync(int taskId, int dataItemId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets completed task items count for a task.
    /// </summary>
    Task<int> GetCompletedCountAsync(int taskId, CancellationToken cancellationToken = default);
}
