namespace DataLabeling.Application.DTOs.User;

/// <summary>
/// Request model for changing the current user's password.
/// </summary>
public class ChangePasswordRequest
{
    /// <summary>
    /// The user's current password (for verification).
    /// </summary>
    public required string CurrentPassword { get; set; }

    /// <summary>
    /// The new password.
    /// </summary>
    public required string NewPassword { get; set; }

    /// <summary>
    /// Confirmation of the new password (must match NewPassword).
    /// </summary>
    public required string ConfirmNewPassword { get; set; }
}
