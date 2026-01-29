namespace DataLabeling.Application.DTOs.Auth;

/// <summary>
/// Response model for successful registration.
/// </summary>
public class RegisterResponse
{
    /// <summary>
    /// Success message.
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// Registered email address.
    /// </summary>
    public required string Email { get; set; }
}
