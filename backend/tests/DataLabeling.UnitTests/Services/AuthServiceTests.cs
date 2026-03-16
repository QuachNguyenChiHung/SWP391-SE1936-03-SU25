using AutoMapper;
using DataLabeling.Application.DTOs.Auth;
using DataLabeling.Application.DTOs.User;
using DataLabeling.Application.Interfaces;
using DataLabeling.Application.Services;
using DataLabeling.Application.Settings;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces.Repositories;
using DataLabeling.UnitTests.Helpers;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace DataLabeling.UnitTests.Services;

/// <summary>
/// Unit tests for AuthService - login, register, password reset flows.
/// </summary>
[Trait("Category", "Unit")]
public class AuthServiceTests
{
    private readonly MockUnitOfWork _mockUow;
    private readonly Mock<IUserRepository> _mockUserRepo;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly Mock<IActivityLogService> _mockActivityLog;
    private readonly Mock<ILogger<AuthService>> _mockLogger;
    private readonly IOptions<JwtSettings> _jwtOptions;
    private readonly IOptions<EmailSettings> _emailOptions;
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _mockUow = new MockUnitOfWork();
        _mockUserRepo = _mockUow.Users;
        _mockMapper = new Mock<IMapper>();
        _mockEmailService = new Mock<IEmailService>();
        _mockActivityLog = new Mock<IActivityLogService>();
        _mockLogger = new Mock<ILogger<AuthService>>();

        _jwtOptions = Options.Create(new JwtSettings
        {
            SecretKey = "super-secret-key-at-least-32-characters-long!",
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            ExpiryMinutes = 60
        });

        _emailOptions = Options.Create(new EmailSettings
        {
            VerificationTokenExpiryHours = 24,
            PasswordResetTokenExpiryHours = 1
        });

        _sut = new AuthService(
            _mockUserRepo.Object,
            _mockUow.Object,
            _mockMapper.Object,
            _jwtOptions,
            _emailOptions,
            _mockEmailService.Object,
            _mockActivityLog.Object,
            _mockLogger.Object);
    }

    // ==================== Login Tests ====================

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsLoginResponse()
    {
        // Arrange
        var password = "Password123!";
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            Name = "Test User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRole.Annotator,
            Status = UserStatus.Active
        };

        var userDto = new UserDto { Id = 1, Email = user.Email, Name = user.Name };

        _mockUserRepo
            .Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _mockMapper
            .Setup(m => m.Map<UserDto>(user))
            .Returns(userDto);

        _mockActivityLog
            .Setup(l => l.LogAsync(It.IsAny<int>(), It.IsAny<ActivityAction>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var request = new LoginRequest { Email = "test@example.com", Password = password };

        // Act
        var result = await _sut.LoginAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Token.Should().NotBeNullOrEmpty();
        result.User.Should().BeEquivalentTo(userDto);
    }

    [Fact]
    public async Task LoginAsync_WithNonExistentEmail_ThrowsUnauthorizedException()
    {
        // Arrange
        _mockUserRepo
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var request = new LoginRequest { Email = "notfound@example.com", Password = "Password123!" };

        // Act
        var act = () => _sut.LoginAsync(request);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>();
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ThrowsUnauthorizedException()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            Name = "Test User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!"),
            Role = UserRole.Annotator,
            Status = UserStatus.Active
        };

        _mockUserRepo
            .Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var request = new LoginRequest { Email = "test@example.com", Password = "WrongPassword123!" };

        // Act
        var act = () => _sut.LoginAsync(request);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>();
    }

    [Fact]
    public async Task LoginAsync_WithInactiveUser_ThrowsUnauthorizedException()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            Name = "Test User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = UserRole.Annotator,
            Status = UserStatus.Inactive
        };

        _mockUserRepo
            .Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var request = new LoginRequest { Email = "test@example.com", Password = "Password123!" };

        // Act
        var act = () => _sut.LoginAsync(request);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*deactivated*");
    }

    [Fact]
    public async Task LoginAsync_WithPendingVerificationUser_ThrowsUnauthorizedException()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            Name = "Test User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = UserRole.Annotator,
            Status = UserStatus.PendingVerification
        };

        _mockUserRepo
            .Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var request = new LoginRequest { Email = "test@example.com", Password = "Password123!" };

        // Act
        var act = () => _sut.LoginAsync(request);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*verify your email*");
    }

    [Fact]
    public async Task LoginAsync_WithLockedAccount_ThrowsUnauthorizedException()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            Name = "Test User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = UserRole.Annotator,
            Status = UserStatus.Active,
            LockoutEnd = DateTime.UtcNow.AddMinutes(10)
        };

        _mockUserRepo
            .Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var request = new LoginRequest { Email = "test@example.com", Password = "Password123!" };

        // Act
        var act = () => _sut.LoginAsync(request);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*locked*");
    }

    // ==================== Register Tests ====================

    [Fact]
    public async Task RegisterAsync_WithValidAnnotatorRequest_ReturnsRegisterResponse()
    {
        // Arrange
        _mockUserRepo
            .Setup(r => r.EmailExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _mockUserRepo
            .Setup(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User u, CancellationToken _) => u);
        _mockEmailService
            .Setup(e => e.SendVerificationEmailAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var request = new RegisterRequest
        {
            Name = "New Annotator",
            Email = "annotator@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            Role = UserRole.Annotator
        };

        // Act
        var result = await _sut.RegisterAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Email.Should().Be("annotator@example.com");
        _mockEmailService.Verify(e => e.SendVerificationEmailAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WithAdminRole_ThrowsValidationException()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Name = "Admin User",
            Email = "admin@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            Role = UserRole.Admin
        };

        // Act
        var act = () => _sut.RegisterAsync(request);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*Annotator or Reviewer*");
    }

    [Fact]
    public async Task RegisterAsync_WithDuplicateEmail_ThrowsValidationException()
    {
        // Arrange
        _mockUserRepo
            .Setup(r => r.EmailExistsAsync("existing@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var request = new RegisterRequest
        {
            Name = "New User",
            Email = "existing@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            Role = UserRole.Annotator
        };

        // Act
        var act = () => _sut.RegisterAsync(request);

        // Assert
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task RegisterAsync_WithMismatchedPasswords_ThrowsValidationException()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Name = "New User",
            Email = "new@example.com",
            Password = "Password123!",
            ConfirmPassword = "DifferentPassword123!",
            Role = UserRole.Annotator
        };

        // Act
        var act = () => _sut.RegisterAsync(request);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*do not match*");
    }

    // ==================== Reset Password Tests ====================

    [Fact]
    public async Task ResetPasswordAsync_WithValidToken_UpdatesPasswordAndClearsToken()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            Name = "Test User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("OldPassword123!"),
            Role = UserRole.Annotator,
            Status = UserStatus.Active,
            PasswordResetToken = "valid-token",
            PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1)
        };

        _mockUserRepo
            .Setup(r => r.GetByPasswordResetTokenAsync("valid-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var request = new ResetPasswordRequest
        {
            Token = "valid-token",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        // Act
        await _sut.ResetPasswordAsync(request);

        // Assert
        BCrypt.Net.BCrypt.Verify("NewPassword123!", user.PasswordHash).Should().BeTrue();
        user.PasswordResetToken.Should().BeNull();
        user.PasswordResetTokenExpiry.Should().BeNull();
        user.FailedLoginAttempts.Should().Be(0);
        _mockUow.Mock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ResetPasswordAsync_WithExpiredToken_ThrowsValidationException()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            Name = "Test User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("OldPassword123!"),
            Role = UserRole.Annotator,
            Status = UserStatus.Active,
            PasswordResetToken = "expired-token",
            PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(-1) // expired
        };

        _mockUserRepo
            .Setup(r => r.GetByPasswordResetTokenAsync("expired-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var request = new ResetPasswordRequest
        {
            Token = "expired-token",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        // Act
        var act = () => _sut.ResetPasswordAsync(request);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*expired*");
    }

    [Fact]
    public async Task ResetPasswordAsync_WithInvalidToken_ThrowsValidationException()
    {
        // Arrange
        _mockUserRepo
            .Setup(r => r.GetByPasswordResetTokenAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var request = new ResetPasswordRequest
        {
            Token = "invalid-token",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "NewPassword123!"
        };

        // Act
        var act = () => _sut.ResetPasswordAsync(request);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*Invalid*");
    }

    [Fact]
    public async Task ResetPasswordAsync_WithMismatchedPasswords_ThrowsValidationException()
    {
        // Arrange
        var request = new ResetPasswordRequest
        {
            Token = "some-token",
            NewPassword = "NewPassword123!",
            ConfirmPassword = "DifferentPassword123!"
        };

        // Act
        var act = () => _sut.ResetPasswordAsync(request);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*do not match*");
    }

    // ==================== Forgot Password Tests ====================

    [Fact]
    public async Task ForgotPasswordAsync_WithValidEmail_SavesTokenAndSendsEmail()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            Name = "Test User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = UserRole.Annotator,
            Status = UserStatus.Active
        };

        _mockUserRepo
            .Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _mockEmailService
            .Setup(e => e.SendPasswordResetEmailAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var request = new ForgotPasswordRequest { Email = "test@example.com" };

        // Act
        await _sut.ForgotPasswordAsync(request);

        // Assert
        user.PasswordResetToken.Should().NotBeNullOrEmpty();
        user.PasswordResetTokenExpiry.Should().NotBeNull();
        _mockUow.Mock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockEmailService.Verify(e => e.SendPasswordResetEmailAsync(
            "test@example.com", "Test User", It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ForgotPasswordAsync_WithNonExistentEmail_ReturnsSilently()
    {
        // Arrange
        _mockUserRepo
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var request = new ForgotPasswordRequest { Email = "notfound@example.com" };

        // Act
        await _sut.ForgotPasswordAsync(request);

        // Assert - no exception, no email sent
        _mockEmailService.Verify(e => e.SendPasswordResetEmailAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ForgotPasswordAsync_WhenEmailFails_StillReturnsSuccessfully()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            Name = "Test User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = UserRole.Annotator,
            Status = UserStatus.Active
        };

        _mockUserRepo
            .Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _mockEmailService
            .Setup(e => e.SendPasswordResetEmailAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("SMTP connection failed"));

        var request = new ForgotPasswordRequest { Email = "test@example.com" };

        // Act - should NOT throw
        await _sut.ForgotPasswordAsync(request);

        // Assert - token was still saved
        user.PasswordResetToken.Should().NotBeNullOrEmpty();
        _mockUow.Mock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
