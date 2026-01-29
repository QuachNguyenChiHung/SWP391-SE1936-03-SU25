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

    /// <summary>
    /// Registers a new user (Annotator or Reviewer only).
    /// </summary>
    /// <param name="request">The registration request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Registration response with confirmation message.</returns>
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Verifies a user's email address.
    /// </summary>
    /// <param name="request">The email verification request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task VerifyEmailAsync(VerifyEmailRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Resends the verification email to a user.
    /// </summary>
    /// <param name="email">The user's email address.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task ResendVerificationEmailAsync(string email, CancellationToken cancellationToken = default);
}
