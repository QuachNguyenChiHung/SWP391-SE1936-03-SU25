using DataLabeling.Core.Entities;

namespace DataLabeling.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for Comment entity.
/// </summary>
public interface ICommentRepository : IRepository<Comment>
{
    /// <summary>
    /// Get all comments for a specific task item, ordered by CreatedAt descending.
    /// </summary>
    Task<IEnumerable<Comment>> GetCommentsByTaskItemIdAsync(int taskItemId);

    /// <summary>
    /// Check if a reviewer comment exists for a task item.
    /// </summary>
    Task<bool> HasReviewerCommentAsync(int taskItemId);
}
