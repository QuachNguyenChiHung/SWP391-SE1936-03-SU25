using Microsoft.EntityFrameworkCore;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Interfaces.Repositories;
using DataLabeling.Infrastructure.Data;

namespace DataLabeling.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Review entity.
/// </summary>
public class ReviewRepository : Repository<Review>, IReviewRepository
{
    public ReviewRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Review>> GetByDataItemIdAsync(int dataItemId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(r => r.DataItemId == dataItemId)
            .Include(r => r.Reviewer)
            .Include(r => r.ReviewErrorTypes)
                .ThenInclude(ret => ret.ErrorType)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Review>> GetByReviewerIdAsync(int reviewerId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(r => r.ReviewerId == reviewerId)
            .Include(r => r.DataItem)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Review?> GetLatestByDataItemIdAsync(int dataItemId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(r => r.DataItemId == dataItemId)
            .Include(r => r.Reviewer)
            .Include(r => r.ReviewErrorTypes)
                .ThenInclude(ret => ret.ErrorType)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Review?> GetWithErrorTypesAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Reviewer)
            .Include(r => r.ReviewErrorTypes)
                .ThenInclude(ret => ret.ErrorType)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<DataItem>> GetPendingReviewItemsAsync(int projectId, CancellationToken cancellationToken = default)
    {
        return await _context.DataItems
            .Where(d => d.Dataset.ProjectId == projectId && d.Status == DataItemStatus.Submitted)
            .Include(d => d.Annotations)
                .ThenInclude(a => a.Label)
            .OrderBy(d => d.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<(IEnumerable<DataItem> Items, int TotalCount)> GetPendingReviewItemsPagedAsync(
        int pageNumber,
        int pageSize,
        int? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.DataItems.Where(d => d.Status == DataItemStatus.Submitted);

        if (projectId.HasValue)
            query = query.Where(d => d.Dataset.ProjectId == projectId.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Include(d => d.Dataset)
                .ThenInclude(ds => ds.Project)
            .Include(d => d.Annotations)
                .ThenInclude(a => a.Label)
            .Include(d => d.TaskItems)
                .ThenInclude(ti => ti.Task)
                    .ThenInclude(t => t.Annotator)
            .OrderBy(d => d.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<ReviewerStatistics> GetReviewerStatisticsAsync(int reviewerId, CancellationToken cancellationToken = default)
    {
        var reviews = await _dbSet
            .Where(r => r.ReviewerId == reviewerId)
            .ToListAsync(cancellationToken);

        return new ReviewerStatistics
        {
            TotalReviewed = reviews.Count,
            ApprovedCount = reviews.Count(r => r.Decision == ReviewDecision.Approved),
            RejectedCount = reviews.Count(r => r.Decision == ReviewDecision.Rejected)
        };
    }
}
