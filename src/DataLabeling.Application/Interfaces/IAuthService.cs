using DataLabeling.Application.DTOs.Auth;

namespace DataLabeling.Application.Interfaces;

/// <summary>
/// Service interface for authentication operations.
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Authenticates a user and returns a JWT token.
    /// </summary>
    /// <param name="request">The login request containing credentials.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Login response with JWT token and user information.</returns>
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
}
