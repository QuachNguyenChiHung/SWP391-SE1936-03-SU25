using Microsoft.EntityFrameworkCore;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Interfaces.Repositories;
using DataLabeling.Infrastructure.Data;

namespace DataLabeling.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for ErrorType entity.
/// Note: ErrorType does not inherit from BaseEntity.
/// </summary>
public class ErrorTypeRepository : IErrorTypeRepository
{
    private readonly ApplicationDbContext _context;
    private readonly DbSet<ErrorType> _dbSet;

    public ErrorTypeRepository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.ErrorTypes;
    }

    public async Task<ErrorType?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<ErrorType?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(e => e.Code == code, cancellationToken);
    }

    public async Task<IEnumerable<ErrorType>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .OrderBy(e => e.Code)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<ErrorType>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default)
    {
        var idList = ids.ToList();
        return await _dbSet
            .Where(e => idList.Contains(e.Id))
            .ToListAsync(cancellationToken);
    }
}
