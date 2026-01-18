using Microsoft.EntityFrameworkCore;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Interfaces.Repositories;
using DataLabeling.Infrastructure.Data;

namespace DataLabeling.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Project entity.
/// </summary>
public class ProjectRepository : Repository<Project>, IProjectRepository
{
    public ProjectRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Project?> GetWithDetailsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.CreatedBy)
            .Include(p => p.Dataset)
            .Include(p => p.Guideline)
            .Include(p => p.Labels.OrderBy(l => l.DisplayOrder))
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Project>> GetByCreatorIdAsync(int creatorId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.CreatedById == creatorId)
            .Include(p => p.Dataset)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Project>> GetByStatusAsync(ProjectStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.Status == status)
            .Include(p => p.CreatedBy)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<(IEnumerable<Project> Items, int TotalCount)> GetPagedAsync(
        int pageNumber,
        int pageSize,
        ProjectStatus? status = null,
        int? creatorId = null,
        string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet.AsQueryable();

        if (status.HasValue)
            query = query.Where(p => p.Status == status.Value);

        if (creatorId.HasValue)
            query = query.Where(p => p.CreatedById == creatorId.Value);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Include(p => p.CreatedBy)
            .Include(p => p.Dataset)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<IEnumerable<Project>> GetWithUpcomingDeadlineAsync(int daysAhead, CancellationToken cancellationToken = default)
    {
        var targetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(daysAhead));

        return await _dbSet
            .Where(p => p.Deadline.HasValue &&
                        p.Deadline.Value <= targetDate &&
                        p.Status == ProjectStatus.Active)
            .Include(p => p.CreatedBy)
            .OrderBy(p => p.Deadline)
            .ToListAsync(cancellationToken);
    }

    public async Task<ProjectStatistics?> GetStatisticsAsync(int projectId, CancellationToken cancellationToken = default)
    {
        var project = await _dbSet
            .Include(p => p.Dataset)
                .ThenInclude(d => d!.DataItems)
            .FirstOrDefaultAsync(p => p.Id == projectId, cancellationToken);

        if (project?.Dataset == null)
            return null;

        var dataItems = project.Dataset.DataItems;

        return new ProjectStatistics
        {
            TotalItems = dataItems.Count,
            PendingItems = dataItems.Count(d => d.Status == DataItemStatus.Pending),
            AssignedItems = dataItems.Count(d => d.Status == DataItemStatus.Assigned),
            InProgressItems = dataItems.Count(d => d.Status == DataItemStatus.InProgress),
            SubmittedItems = dataItems.Count(d => d.Status == DataItemStatus.Submitted),
            ApprovedItems = dataItems.Count(d => d.Status == DataItemStatus.Approved),
            RejectedItems = dataItems.Count(d => d.Status == DataItemStatus.Rejected)
        };
    }
}
