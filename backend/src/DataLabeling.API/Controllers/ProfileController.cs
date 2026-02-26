using AutoMapper;
using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.User;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DataLabeling.API.Controllers;

/// <summary>
/// Controller for managing the current user's own profile.
/// </summary>
[Route("api/profile")]
[ApiController]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public ProfileController(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                 ?? User.FindFirst("sub");

        if (claim != null && int.TryParse(claim.Value, out int userId))
            return userId;

        return 0;
    }

    /// <summary>
    /// Get the current user's profile information.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetProfile(
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token." });

        var user = await _uow.Users.GetByIdAsync(userId, cancellationToken);
        if (user == null)
            return NotFound(ApiResponse<UserDto>.FailureResponse("User not found."));

        var dto = _mapper.Map<UserDto>(user);
        return Ok(ApiResponse<UserDto>.SuccessResponse(dto));
    }

    /// <summary>
    /// Update the current user's name.
    /// </summary>
    /// <param name="request">Profile update data.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpPut]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token." });

        var user = await _uow.Users.GetByIdAsync(userId, cancellationToken);
        if (user == null)
            return NotFound(ApiResponse<UserDto>.FailureResponse("User not found."));

        user.Name = request.Name;
        user.UpdatedAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync(cancellationToken);

        var dto = _mapper.Map<UserDto>(user);
        return Ok(ApiResponse<UserDto>.SuccessResponse(dto, "Profile updated successfully."));
    }

    /// <summary>
    /// Change the current user's password. Requires the current password for verification.
    /// </summary>
    /// <param name="request">Password change data.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpPost("change-password")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ApiResponse>> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token." });

        var user = await _uow.Users.GetByIdAsync(userId, cancellationToken);
        if (user == null)
            return NotFound(ApiResponse.FailureResponse("User not found."));

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(ApiResponse.FailureResponse("Current password is incorrect."));

        if (request.NewPassword != request.ConfirmNewPassword)
            return BadRequest(ApiResponse.FailureResponse("New password and confirmation do not match."));

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse.SuccessResponse("Password changed successfully."));
    }
}
