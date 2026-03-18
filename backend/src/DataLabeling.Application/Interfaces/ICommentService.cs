using DataLabeling.Application.DTOs.Comments;

namespace DataLabeling.Application.Interfaces;

/// <summary>
/// Service interface for comment operations.
/// </summary>
public interface ICommentService
{
    /// <summary>
    /// Get all comments for a task item, ordered by CreatedAt descending.
    /// </summary>
    Task<IEnumerable<CommentDto>> GetCommentsByTaskItemIdAsync(int taskItemId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Add a comment to a task item.
    /// </summary>
    Task<CommentDto> AddCommentAsync(int taskItemId, int authorId, string content, CancellationToken cancellationToken = default);
}
