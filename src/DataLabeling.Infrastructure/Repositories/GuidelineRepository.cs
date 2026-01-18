using Microsoft.EntityFrameworkCore;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Interfaces.Repositories;
using DataLabeling.Infrastructure.Data;

namespace DataLabeling.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Guideline entity.
/// </summary>
public class GuidelineRepository : Repository<Guideline>, IGuidelineRepository
{
    public GuidelineRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Guideline?> GetByProjectIdAsync(int projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(g => g.ProjectId == projectId, cancellationToken);
    }

    public async Task UpdateContentAsync(int projectId, string content, CancellationToken cancellationToken = default)
    {
        var guideline = await _dbSet
            .FirstOrDefaultAsync(g => g.ProjectId == projectId, cancellationToken);

        if (guideline != null)
        {
            guideline.Content = content;
            guideline.Version++;
            guideline.UpdatedAt = DateTime.UtcNow;
        }
    }
}
