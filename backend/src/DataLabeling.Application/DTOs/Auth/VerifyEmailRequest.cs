namespace DataLabeling.Application.DTOs.Auth;

/// <summary>
/// Request model for email verification.
/// </summary>
public class VerifyEmailRequest
{
    /// <summary>
    /// User's email address.
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// Verification token sent via email.
    /// </summary>
    public required string Token { get; set; }
}
