using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.Auth;

/// <summary>
/// Request model for user self-registration.
/// </summary>
public class RegisterRequest
{
    /// <summary>
    /// User's full name.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// User's email address.
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// User's password.
    /// </summary>
    public required string Password { get; set; }

    /// <summary>
    /// Password confirmation (must match Password).
    /// </summary>
    public required string ConfirmPassword { get; set; }

    /// <summary>
    /// Requested role (only Annotator or Reviewer allowed for self-registration).
    /// </summary>
    public UserRole Role { get; set; }
}
