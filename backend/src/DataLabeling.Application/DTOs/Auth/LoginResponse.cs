using DataLabeling.Application.DTOs.User;

namespace DataLabeling.Application.DTOs.Auth;

/// <summary>
/// Response model for successful login.
/// </summary>
public class LoginResponse
{
    /// <summary>
    /// JWT access token.
    /// </summary>
    public required string Token { get; set; }

    /// <summary>
    /// Token type (always "Bearer").
    /// </summary>
    public string TokenType { get; set; } = "Bearer";

    /// <summary>
    /// Token expiration time in UTC.
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// The authenticated user's information.
    /// </summary>
    public required UserDto User { get; set; }
}
