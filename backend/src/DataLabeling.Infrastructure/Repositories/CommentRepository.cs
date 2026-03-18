using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Interfaces.Repositories;
using DataLabeling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DataLabeling.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Comment entity.
/// </summary>
public class CommentRepository : Repository<Comment>, ICommentRepository
{
    public CommentRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Comment>> GetCommentsByTaskItemIdAsync(int taskItemId)
    {
        return await _dbSet
            .Where(c => c.TaskItemId == taskItemId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> HasReviewerCommentAsync(int taskItemId)
    {
        return await _dbSet.AnyAsync(c =>
            c.TaskItemId == taskItemId &&
            c.AuthorRole == UserRole.Reviewer &&
            !string.IsNullOrEmpty(c.Content));
    }
}
