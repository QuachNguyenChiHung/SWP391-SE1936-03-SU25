using AutoMapper;
using DataLabeling.Application.DTOs.User;
using DataLabeling.Application.Interfaces;
using DataLabeling.Application.Services;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Exceptions;
using DataLabeling.UnitTests.Helpers;
using FluentAssertions;
using Moq;

namespace DataLabeling.UnitTests.Services;

/// <summary>
/// Unit tests for UserService - CRUD, approval/rejection workflow.
/// </summary>
[Trait("Category", "Unit")]
public class UserServiceTests
{
    private readonly MockUnitOfWork _mockUow;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly UserService _sut;

    public UserServiceTests()
    {
        _mockUow = new MockUnitOfWork();
        _mockMapper = new Mock<IMapper>();
        _mockEmailService = new Mock<IEmailService>();

        _sut = new UserService(
            _mockUow.Users.Object,
            _mockUow.Object,
            _mockMapper.Object,
            _mockEmailService.Object);
    }

    // ==================== GetByIdAsync Tests ====================

    [Fact]
    public async Task GetByIdAsync_WithExistingUser_ReturnsUserDto()
    {
        // Arrange
        var user = new User
        {
            Id = 1, Email = "test@example.com", Name = "Test User",
            PasswordHash = "hash", Role = UserRole.Annotator, Status = UserStatus.Active
        };
        var userDto = new UserDto { Id = 1, Email = user.Email, Name = user.Name };

        _mockUow.Users.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _mockMapper.Setup(m => m.Map<UserDto>(user)).Returns(userDto);

        // Act
        var result = await _sut.GetByIdAsync(1);

        // Assert
        result.Should().BeEquivalentTo(userDto);
    }

    [Fact]
    public async Task GetByIdAsync_WithNonExistentUser_ThrowsNotFoundException()
    {
        // Arrange
        _mockUow.Users
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act
        var act = () => _sut.GetByIdAsync(999);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*999*");
    }

    // ==================== CreateAsync Tests ====================

    [Fact]
    public async Task CreateAsync_WithValidRequest_CreatesUserAndReturnsDto()
    {
        // Arrange
        _mockUow.Users
            .Setup(r => r.EmailExistsAsync("new@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _mockUow.Users
            .Setup(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User u, CancellationToken _) => u);

        User? capturedUser = null;
        _mockMapper
            .Setup(m => m.Map<UserDto>(It.IsAny<User>()))
            .Callback<object>(u => capturedUser = (User)u)
            .Returns(new UserDto { Id = 1, Email = "new@example.com", Name = "New User" });

        var request = new CreateUserRequest
        {
            Name = "New User",
            Email = "new@example.com",
            Password = "Password123!",
            Role = UserRole.Annotator
        };

        // Act
        var result = await _sut.CreateAsync(request);

        // Assert
        result.Should().NotBeNull();
        _mockUow.Mock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUow.Users.Verify(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateEmail_ThrowsConflictException()
    {
        // Arrange
        _mockUow.Users
            .Setup(r => r.EmailExistsAsync("existing@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var request = new CreateUserRequest
        {
            Name = "Some User",
            Email = "existing@example.com",
            Password = "Password123!",
            Role = UserRole.Annotator
        };

        // Act
        var act = () => _sut.CreateAsync(request);

        // Assert
        await act.Should().ThrowAsync<ConflictException>();
    }

    // ==================== DeleteAsync Tests ====================

    [Fact]
    public async Task DeleteAsync_WithExistingUserNoRelatedData_DeletesUser()
    {
        // Arrange
        var user = new User
        {
            Id = 5, Email = "user@example.com", Name = "To Delete",
            PasswordHash = "hash", Role = UserRole.Annotator, Status = UserStatus.Active
        };

        _mockUow.Users.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _mockUow.Users.Setup(r => r.HasRelatedDataAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        // Act
        await _sut.DeleteAsync(5);

        // Assert
        _mockUow.Users.Verify(r => r.Delete(user), Times.Once);
        _mockUow.Mock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WithRelatedData_ThrowsValidationException()
    {
        // Arrange
        var user = new User
        {
            Id = 5, Email = "user@example.com", Name = "Has Data",
            PasswordHash = "hash", Role = UserRole.Annotator, Status = UserStatus.Active
        };

        _mockUow.Users.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _mockUow.Users.Setup(r => r.HasRelatedDataAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        // Act
        var act = () => _sut.DeleteAsync(5);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*Cannot delete user with existing data*");
    }

    [Fact]
    public async Task DeleteAsync_WithNonExistentUser_ThrowsNotFoundException()
    {
        // Arrange
        _mockUow.Users.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        // Act
        var act = () => _sut.DeleteAsync(999);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    // ==================== ApproveUserAsync Tests ====================

    [Fact]
    public async Task ApproveUserAsync_WithPendingUser_ActivatesAndSendsEmail()
    {
        // Arrange
        var user = new User
        {
            Id = 10, Email = "pending@example.com", Name = "Pending User",
            PasswordHash = "hash", Role = UserRole.Annotator, Status = UserStatus.PendingApproval
        };
        var userDto = new UserDto { Id = 10, Email = user.Email, Status = UserStatus.Active };

        _mockUow.Users.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _mockMapper.Setup(m => m.Map<UserDto>(user)).Returns(userDto);
        _mockEmailService
            .Setup(e => e.SendApprovalConfirmationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.ApproveUserAsync(10, approverId: 1, request: null);

        // Assert
        user.Status.Should().Be(UserStatus.Active);
        user.ApprovedById.Should().Be(1);
        _mockEmailService.Verify(
            e => e.SendApprovalConfirmationAsync("pending@example.com", "Pending User", It.IsAny<CancellationToken>()),
            Times.Once);
        _mockUow.Mock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ApproveUserAsync_WithActiveUser_ThrowsValidationException()
    {
        // Arrange
        var user = new User
        {
            Id = 10, Email = "active@example.com", Name = "Active User",
            PasswordHash = "hash", Role = UserRole.Annotator, Status = UserStatus.Active
        };

        _mockUow.Users.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(user);

        // Act
        var act = () => _sut.ApproveUserAsync(10, approverId: 1, request: null);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*not pending approval*");
    }

    // ==================== RejectUserAsync Tests ====================

    [Fact]
    public async Task RejectUserAsync_WithPendingUser_DeactivatesAndSendsEmail()
    {
        // Arrange
        var user = new User
        {
            Id = 10, Email = "pending@example.com", Name = "Pending User",
            PasswordHash = "hash", Role = UserRole.Annotator, Status = UserStatus.PendingApproval
        };

        _mockUow.Users.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _mockEmailService
            .Setup(e => e.SendRejectionNotificationAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var rejectRequest = new RejectUserRequest { Reason = "Does not meet requirements." };

        // Act
        await _sut.RejectUserAsync(10, approverId: 1, rejectRequest);

        // Assert
        user.Status.Should().Be(UserStatus.Inactive);
        user.RejectionReason.Should().Be("Does not meet requirements.");
        _mockEmailService.Verify(
            e => e.SendRejectionNotificationAsync("pending@example.com", "Pending User",
                "Does not meet requirements.", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RejectUserAsync_WithNonExistentUser_ThrowsNotFoundException()
    {
        // Arrange
        _mockUow.Users.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        // Act
        var act = () => _sut.RejectUserAsync(999, 1, new RejectUserRequest { Reason = "reason" });

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }
}
