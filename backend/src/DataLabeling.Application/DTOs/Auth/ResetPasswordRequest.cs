namespace DataLabeling.Application.DTOs.Auth;

/// <summary>
/// Request model for password reset.
/// </summary>
public class ResetPasswordRequest
{
    /// <summary>
    /// Password reset token from email.
    /// </summary>
    public required string Token { get; set; }

    /// <summary>
    /// New password.
    /// </summary>
    public required string NewPassword { get; set; }

    /// <summary>
    /// Password confirmation (must match NewPassword).
    /// </summary>
    public required string ConfirmPassword { get; set; }
}
