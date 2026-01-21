using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.User;

/// <summary>
/// Request model for creating a new user.
/// </summary>
public class CreateUserRequest
{
    /// <summary>
    /// User's email address.
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// User's password (will be hashed).
    /// </summary>
    public required string Password { get; set; }

    /// <summary>
    /// User's full name.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// User's role in the system.
    /// </summary>
    public UserRole Role { get; set; }
}
