using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using DataLabeling.Application.DTOs.Auth;
using DataLabeling.Application.DTOs.User;
using DataLabeling.Application.Interfaces;
using DataLabeling.Application.Settings;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces;
using DataLabeling.Core.Interfaces.Repositories;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace DataLabeling.Application.Services;

/// <summary>
/// Service for authentication operations.
/// </summary>
public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly JwtSettings _jwtSettings;
    private readonly EmailSettings _emailSettings;
    private readonly IEmailService _emailService;

    private const int MAX_FAILED_ATTEMPTS = 5;
    private const int LOCKOUT_MINUTES = 15;

    public AuthService(
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IOptions<JwtSettings> jwtSettings,
        IOptions<EmailSettings> emailSettings,
        IEmailService emailService)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _jwtSettings = jwtSettings.Value;
        _emailSettings = emailSettings.Value;
        _emailService = emailService;
    }

    /// <inheritdoc/>
    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);

        if (user == null)
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        // Check if account is inactive
        if (user.Status == UserStatus.Inactive)
        {
            throw new UnauthorizedException("Your account has been deactivated. Please contact an administrator.");
        }

        // Check if email is pending verification
        if (user.Status == UserStatus.PendingVerification)
        {
            throw new UnauthorizedException("Please verify your email address before logging in.");
        }

        // Check if account is pending approval
        if (user.Status == UserStatus.PendingApproval)
        {
            throw new UnauthorizedException("Your account is pending approval. Please wait for an administrator to approve your registration.");
        }

        // Check if account is locked
        if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
        {
            var remainingMinutes = (int)(user.LockoutEnd.Value - DateTime.UtcNow).TotalMinutes + 1;
            throw new UnauthorizedException($"Account is locked. Please try again in {remainingMinutes} minute(s).");
        }

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            // Increment failed attempts
            user.FailedLoginAttempts++;

            if (user.FailedLoginAttempts >= MAX_FAILED_ATTEMPTS)
            {
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(LOCKOUT_MINUTES);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                throw new UnauthorizedException($"Account has been locked due to too many failed login attempts. Please try again in {LOCKOUT_MINUTES} minutes.");
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedException("Invalid email or password.");
        }

        // Reset failed attempts on successful login
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;
        user.LastLoginAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Generate JWT token
        var token = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes);

        return new LoginResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = _mapper.Map<UserDto>(user)
        };
    }

    /// <inheritdoc/>
    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        // Validate role - only Annotator and Reviewer can self-register
        if (request.Role != UserRole.Annotator && request.Role != UserRole.Reviewer)
        {
            throw new ValidationException("Self-registration is only allowed for Annotator or Reviewer roles.");
        }

        // Check if email already exists (return generic message for security)
        if (await _userRepository.EmailExistsAsync(request.Email, cancellationToken))
        {
            // Return success message even if email exists (security best practice)
            return new RegisterResponse
            {
                Message = "If this email is not already registered, you will receive a verification email shortly.",
                Email = request.Email
            };
        }

        // Generate verification token
        var verificationToken = GenerateSecureToken();

        // Create user with PendingVerification status
        var user = new User
        {
            Email = request.Email.ToLowerInvariant(),
            Name = request.Name,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role,
            Status = UserStatus.PendingVerification,
            IsEmailVerified = false,
            EmailVerificationToken = verificationToken,
            EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(_emailSettings.VerificationTokenExpiryHours)
        };

        await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Send verification email
        await _emailService.SendVerificationEmailAsync(
            user.Email,
            user.Name,
            verificationToken,
            cancellationToken);

        return new RegisterResponse
        {
            Message = "Registration successful. Please check your email to verify your account.",
            Email = request.Email
        };
    }

    /// <inheritdoc/>
    public async Task VerifyEmailAsync(VerifyEmailRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByVerificationTokenAsync(request.Token, cancellationToken);

        if (user == null || !user.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException("Invalid or expired verification token.");
        }

        // Check if token is expired
        if (user.EmailVerificationTokenExpiry < DateTime.UtcNow)
        {
            throw new ValidationException("Verification token has expired. Please request a new one.");
        }

        // Check if already verified
        if (user.IsEmailVerified)
        {
            throw new ValidationException("Email has already been verified.");
        }

        // Update user status
        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiry = null;
        user.Status = UserStatus.PendingApproval;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Notify all admins and managers about the new pending user
        var adminsAndManagers = await _userRepository.GetAdminsAndManagersAsync(cancellationToken);
        foreach (var admin in adminsAndManagers)
        {
            await _emailService.SendApprovalNotificationAsync(
                admin.Email,
                admin.Name,
                user.Name,
                user.Email,
                user.Role.ToString(),
                cancellationToken);
        }
    }

    /// <inheritdoc/>
    public async Task ResendVerificationEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(email, cancellationToken);

        // Return silently if user doesn't exist (security best practice)
        if (user == null)
        {
            return;
        }

        // Check if user is in correct status
        if (user.Status != UserStatus.PendingVerification)
        {
            return;
        }

        // Generate new verification token
        var verificationToken = GenerateSecureToken();
        user.EmailVerificationToken = verificationToken;
        user.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(_emailSettings.VerificationTokenExpiryHours);
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Send verification email
        await _emailService.SendVerificationEmailAsync(
            user.Email,
            user.Name,
            verificationToken,
            cancellationToken);
    }

    /// <summary>
    /// Generates a cryptographically secure random token.
    /// </summary>
    private static string GenerateSecureToken()
    {
        var randomBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");
    }

    /// <inheritdoc/>
    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);

        // Return silently if user doesn't exist (security best practice - don't reveal if email exists)
        if (user == null)
        {
            return;
        }

        // Only allow password reset for active users
        if (user.Status != UserStatus.Active)
        {
            return;
        }

        // Generate password reset token
        var resetToken = GenerateSecureToken();
        user.PasswordResetToken = resetToken;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(_emailSettings.PasswordResetTokenExpiryHours);
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Send password reset email
        await _emailService.SendPasswordResetEmailAsync(
            user.Email,
            user.Name,
            resetToken,
            cancellationToken);
    }

    /// <inheritdoc/>
    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        // Validate password confirmation
        if (request.NewPassword != request.ConfirmPassword)
        {
            throw new ValidationException("Password and confirmation do not match.");
        }

        var user = await _userRepository.GetByPasswordResetTokenAsync(request.Token, cancellationToken);

        if (user == null)
        {
            throw new ValidationException("Invalid or expired password reset token.");
        }

        // Check if token is expired
        if (user.PasswordResetTokenExpiry < DateTime.UtcNow)
        {
            throw new ValidationException("Password reset token has expired. Please request a new one.");
        }

        // Update password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Generates a JWT token for the specified user.
    /// </summary>
    private string GenerateJwtToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Role, user.Role.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
