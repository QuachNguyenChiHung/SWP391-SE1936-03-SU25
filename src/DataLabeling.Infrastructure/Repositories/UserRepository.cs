using Microsoft.EntityFrameworkCore;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Interfaces.Repositories;
using DataLabeling.Infrastructure.Data;

namespace DataLabeling.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for User entity.
/// </summary>
public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower(), cancellationToken);
    }

    public async Task<IEnumerable<User>> GetByRoleAsync(UserRole role, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(u => u.Role == role)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<User>> GetByStatusAsync(UserStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(u => u.Status == status)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(u => u.Email.ToLower() == email.ToLower(), cancellationToken);
    }

    public async Task<(IEnumerable<User> Items, int TotalCount)> GetPagedAsync(
        int pageNumber,
        int pageSize,
        UserRole? role = null,
        UserStatus? status = null,
        string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet.AsQueryable();

        if (role.HasValue)
            query = query.Where(u => u.Role == role.Value);

        if (status.HasValue)
            query = query.Where(u => u.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.ToLower();
            query = query.Where(u =>
                u.Name.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(u => u.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<User?> GetByVerificationTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.EmailVerificationToken == token, cancellationToken);
    }

    public async Task<IEnumerable<User>> GetPendingApprovalUsersAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(u => u.Status == UserStatus.PendingApproval)
            .OrderBy(u => u.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<User>> GetAdminsAndManagersAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(u => (u.Role == UserRole.Admin || u.Role == UserRole.Manager)
                        && u.Status == UserStatus.Active)
            .ToListAsync(cancellationToken);
    }
}
