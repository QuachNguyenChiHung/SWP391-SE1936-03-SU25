using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.User;

/// <summary>
/// Data transfer object for User entity.
/// </summary>
public class UserDto
{
    /// <summary>
    /// User's unique identifier.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// User's email address.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// User's full name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// User's role in the system.
    /// </summary>
    public UserRole Role { get; set; }

    /// <summary>
    /// User's role as a string.
    /// </summary>
    public string RoleName => Role.ToString();

    /// <summary>
    /// Account status.
    /// </summary>
    public UserStatus Status { get; set; }

    /// <summary>
    /// Account status as a string.
    /// </summary>
    public string StatusName => Status.ToString();

    /// <summary>
    /// When the user account was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the user last logged in.
    /// </summary>
    public DateTime? LastLoginAt { get; set; }
}
