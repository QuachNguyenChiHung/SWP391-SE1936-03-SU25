using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.User;

/// <summary>
/// DTO for users pending approval.
/// </summary>
public class PendingUserDto
{
    /// <summary>
    /// User ID.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// User's full name.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// User's email address.
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// Requested role.
    /// </summary>
    public UserRole Role { get; set; }

    /// <summary>
    /// Registration date.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
