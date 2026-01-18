using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for User entity operations.
/// </summary>
public interface IUserRepository : IRepository<User>
{
    /// <summary>
    /// Gets a user by email address.
    /// </summary>
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all users with the specified role.
    /// </summary>
    Task<IEnumerable<User>> GetByRoleAsync(UserRole role, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all users with the specified status.
    /// </summary>
    Task<IEnumerable<User>> GetByStatusAsync(UserStatus status, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if an email is already in use.
    /// </summary>
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets users with pagination and optional filtering.
    /// </summary>
    Task<(IEnumerable<User> Items, int TotalCount)> GetPagedAsync(
        int pageNumber,
        int pageSize,
        UserRole? role = null,
        UserStatus? status = null,
        string? searchTerm = null,
        CancellationToken cancellationToken = default);
}
