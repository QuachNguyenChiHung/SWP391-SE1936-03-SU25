using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.User;
using DataLabeling.Core.Enums;

namespace DataLabeling.Application.Interfaces;

/// <summary>
/// Service interface for user management operations.
/// </summary>
public interface IUserService
{
    /// <summary>
    /// Gets a paginated list of users with optional filtering.
    /// </summary>
    /// <param name="pageNumber">Page number (1-based).</param>
    /// <param name="pageSize">Number of items per page.</param>
    /// <param name="searchTerm">Optional search term for name or email.</param>
    /// <param name="role">Optional role filter.</param>
    /// <param name="status">Optional status filter.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Paginated list of users.</returns>
    Task<PagedResponse<UserDto>> GetAllAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? searchTerm = null,
        UserRole? role = null,
        UserStatus? status = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a user by their ID.
    /// </summary>
    /// <param name="id">User ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The user DTO.</returns>
    Task<UserDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new user.
    /// </summary>
    /// <param name="request">Create user request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created user DTO.</returns>
    Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing user.
    /// </summary>
    /// <param name="id">User ID.</param>
    /// <param name="request">Update user request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated user DTO.</returns>
    Task<UserDto> UpdateAsync(int id, UpdateUserRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a user by their ID.
    /// </summary>
    /// <param name="id">User ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all users pending approval.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of pending users.</returns>
    Task<IEnumerable<PendingUserDto>> GetPendingApprovalUsersAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Approves a user registration.
    /// </summary>
    /// <param name="userId">The user ID to approve.</param>
    /// <param name="approverId">The ID of the admin/manager approving.</param>
    /// <param name="request">Optional approval request with notes.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The approved user DTO.</returns>
    Task<UserDto> ApproveUserAsync(int userId, int approverId, ApproveUserRequest? request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Rejects a user registration.
    /// </summary>
    /// <param name="userId">The user ID to reject.</param>
    /// <param name="approverId">The ID of the admin/manager rejecting.</param>
    /// <param name="request">Rejection request with reason.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task RejectUserAsync(int userId, int approverId, RejectUserRequest request, CancellationToken cancellationToken = default);
}
