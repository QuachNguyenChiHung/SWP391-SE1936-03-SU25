namespace DataLabeling.Application.DTOs.User;

/// <summary>
/// Request model for updating the current user's profile.
/// </summary>
public class UpdateProfileRequest
{
    /// <summary>
    /// User's full name.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Areas of specialization for the user.
    /// </summary>
    public string? SpecializeIn { get; set; }
}
