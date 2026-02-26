namespace DataLabeling.Application.DTOs.Auth;

/// <summary>
/// Request model for forgot password.
/// </summary>
public class ForgotPasswordRequest
{
    /// <summary>
    /// User's email address.
    /// </summary>
    public required string Email { get; set; }
}
