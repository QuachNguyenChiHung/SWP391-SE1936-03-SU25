namespace DataLabeling.Application.DTOs.Auth;

/// <summary>
/// Request model for resending verification email.
/// </summary>
public class ResendVerificationRequest
{
    /// <summary>
    /// User's email address.
    /// </summary>
    public required string Email { get; set; }
}
