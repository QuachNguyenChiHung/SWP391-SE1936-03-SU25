using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.User;

/// <summary>
/// Request model for updating an existing user.
/// </summary>
public class UpdateUserRequest
{
    /// <summary>
    /// User's full name.
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// User's role in the system.
    /// </summary>
    public UserRole? Role { get; set; }

    /// <summary>
    /// Account status.
    /// </summary>
    public UserStatus? Status { get; set; }
}
