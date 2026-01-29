using System.Security.Claims;
using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.User;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DataLabeling.API.Controllers;

/// <summary>
/// Controller for user management operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Gets the current user's ID from JWT claims.
    /// </summary>
    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                          ?? User.FindFirst("sub");
        return int.Parse(userIdClaim!.Value);
    }

    /// <summary>
    /// Gets a paginated list of users.
    /// </summary>
    /// <param name="pageNumber">Page number (default: 1).</param>
    /// <param name="pageSize">Page size (default: 10).</param>
    /// <param name="search">Search term for name or email.</param>
    /// <param name="role">Filter by role.</param>
    /// <param name="status">Filter by status.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Paginated list of users.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResponse<UserDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] UserRole? role = null,
        [FromQuery] UserStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _userService.GetAllAsync(pageNumber, pageSize, search, role, status, cancellationToken);
        return Ok(ApiResponse<PagedResponse<UserDto>>.SuccessResponse(result));
    }

    /// <summary>
    /// Gets a user by ID.
    /// </summary>
    /// <param name="id">User ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The user.</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _userService.GetByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<UserDto>.SuccessResponse(result));
    }

    /// <summary>
    /// Creates a new user.
    /// </summary>
    /// <param name="request">User creation data.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created user.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromBody] CreateUserRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _userService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<UserDto>.SuccessResponse(result, "User created successfully."));
    }

    /// <summary>
    /// Updates an existing user.
    /// </summary>
    /// <param name="id">User ID.</param>
    /// <param name="request">User update data.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated user.</returns>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateUserRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _userService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<UserDto>.SuccessResponse(result, "User updated successfully."));
    }

    /// <summary>
    /// Deletes a user (soft delete).
    /// </summary>
    /// <param name="id">User ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>No content.</returns>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _userService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("User deleted successfully."));
    }

    /// <summary>
    /// Gets all users pending approval.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of pending users.</returns>
    [HttpGet("pending-approval")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PendingUserDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPendingApproval(CancellationToken cancellationToken)
    {
        var result = await _userService.GetPendingApprovalUsersAsync(cancellationToken);
        return Ok(ApiResponse<IEnumerable<PendingUserDto>>.SuccessResponse(result));
    }

    /// <summary>
    /// Approves a user registration.
    /// </summary>
    /// <param name="id">User ID to approve.</param>
    /// <param name="request">Optional approval notes.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The approved user.</returns>
    [HttpPost("{id:int}/approve")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Approve(
        int id,
        [FromBody] ApproveUserRequest? request,
        CancellationToken cancellationToken)
    {
        var approverId = GetCurrentUserId();
        var result = await _userService.ApproveUserAsync(id, approverId, request, cancellationToken);
        return Ok(ApiResponse<UserDto>.SuccessResponse(result, "User approved successfully."));
    }

    /// <summary>
    /// Rejects a user registration.
    /// </summary>
    /// <param name="id">User ID to reject.</param>
    /// <param name="request">Rejection reason.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Confirmation message.</returns>
    [HttpPost("{id:int}/reject")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reject(
        int id,
        [FromBody] RejectUserRequest request,
        CancellationToken cancellationToken)
    {
        var approverId = GetCurrentUserId();
        await _userService.RejectUserAsync(id, approverId, request, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("User registration rejected."));
    }
}
