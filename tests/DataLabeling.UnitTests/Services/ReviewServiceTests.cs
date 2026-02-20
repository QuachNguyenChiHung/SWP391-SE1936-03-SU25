using DataLabeling.Application.DTOs.Reviews;
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
/// Unit tests for ReviewService - approve/reject workflow.
/// </summary>
[Trait("Category", "Unit")]
public class ReviewServiceTests
{
    private readonly MockUnitOfWork _mockUow;
    private readonly Mock<IActivityLogService> _mockActivityLog;
    private readonly ReviewService _sut;

    private static DataItem MakeDataItem(int id, DataItemStatus status) => new()
    {
        Id = id,
        DatasetId = 1,
        FileName = $"image{id}.jpg",
        FilePath = $"/uploads/1/1/image{id}.jpg",
        Status = status
    };

    private static User MakeUser(int id, UserRole role, UserStatus status = UserStatus.Active) => new()
    {
        Id = id,
        Email = $"user{id}@example.com",
        Name = $"User {id}",
        PasswordHash = "hash",
        Role = role,
        Status = status
    };

    public ReviewServiceTests()
    {
        _mockUow = new MockUnitOfWork();
        _mockActivityLog = new Mock<IActivityLogService>();
        _mockActivityLog
            .Setup(l => l.LogAsync(It.IsAny<int>(), It.IsAny<ActivityAction>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _sut = new ReviewService(_mockUow.Object, _mockActivityLog.Object);
    }

    // ==================== CreateReviewAsync - Approve ====================

    [Fact]
    public async Task CreateReviewAsync_WhenApproved_SetsDataItemStatusToApproved()
    {
        // Arrange
        var dataItem = MakeDataItem(1, DataItemStatus.Submitted);
        var reviewer = MakeUser(10, UserRole.Reviewer);

        var reviewForReturn = new Review
        {
            Id = 1, DataItemId = 1, ReviewerId = 10, Decision = ReviewDecision.Approved,
            ReviewErrorTypes = new List<ReviewErrorType>()
        };

        _mockUow.DataItems.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(dataItem);
        _mockUow.Users.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(reviewer);
        _mockUow.Reviews.Setup(r => r.AddAsync(It.IsAny<Review>(), It.IsAny<CancellationToken>())).ReturnsAsync((Review r, CancellationToken _) => r);
        _mockUow.Reviews.Setup(r => r.GetWithErrorTypesAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(reviewForReturn);

        // For CheckAndUpdateTaskCompletionAsync - set up TaskItems mock
        _mockUow.TaskItems
            .Setup(r => r.GetByDataItemIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TaskItem>());

        var request = new CreateReviewRequest { Decision = ReviewDecision.Approved };

        // Act
        var result = await _sut.CreateReviewAsync(1, request, reviewerId: 10);

        // Assert
        dataItem.Status.Should().Be(DataItemStatus.Approved);
        _mockUow.Mock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task CreateReviewAsync_WhenRejected_SetsDataItemStatusToRejected()
    {
        // Arrange
        var dataItem = MakeDataItem(1, DataItemStatus.Submitted);
        var reviewer = MakeUser(10, UserRole.Reviewer);
        var errorTypes = new List<ErrorType> { new ErrorType { Id = 1, Code = "E01", Name = "Bounding Box Error" } };

        var reviewForReturn = new Review
        {
            Id = 1, DataItemId = 1, ReviewerId = 10, Decision = ReviewDecision.Rejected,
            Feedback = "Bounding box is wrong.",
            ReviewErrorTypes = new List<ReviewErrorType>()
        };

        _mockUow.DataItems.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(dataItem);
        _mockUow.Users.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(reviewer);
        _mockUow.ErrorTypes
            .Setup(r => r.GetByIdsAsync(It.IsAny<IEnumerable<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(errorTypes);
        _mockUow.Reviews.Setup(r => r.AddAsync(It.IsAny<Review>(), It.IsAny<CancellationToken>())).ReturnsAsync((Review r, CancellationToken _) => r);
        _mockUow.Reviews.Setup(r => r.GetWithErrorTypesAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(reviewForReturn);
        _mockUow.TaskItems
            .Setup(r => r.GetByDataItemIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TaskItem>());

        var request = new CreateReviewRequest
        {
            Decision = ReviewDecision.Rejected,
            Feedback = "Bounding box is wrong.",
            ErrorTypeIds = new[] { 1 }
        };

        // Act
        var result = await _sut.CreateReviewAsync(1, request, reviewerId: 10);

        // Assert
        dataItem.Status.Should().Be(DataItemStatus.Rejected);
    }

    // ==================== CreateReviewAsync - Validation ====================

    [Fact]
    public async Task CreateReviewAsync_WithNonExistentDataItem_ThrowsNotFoundException()
    {
        // Arrange
        _mockUow.DataItems.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((DataItem?)null);

        var request = new CreateReviewRequest { Decision = ReviewDecision.Approved };

        // Act
        var act = () => _sut.CreateReviewAsync(99, request, reviewerId: 10);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*DataItem*");
    }

    [Fact]
    public async Task CreateReviewAsync_WithNonSubmittedDataItem_ThrowsValidationException()
    {
        // Arrange
        var dataItem = MakeDataItem(1, DataItemStatus.Pending); // Not submitted
        var reviewer = MakeUser(10, UserRole.Reviewer);

        _mockUow.DataItems.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(dataItem);
        _mockUow.Users.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(reviewer);

        var request = new CreateReviewRequest { Decision = ReviewDecision.Approved };

        // Act
        var act = () => _sut.CreateReviewAsync(1, request, reviewerId: 10);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*not ready for review*");
    }

    [Fact]
    public async Task CreateReviewAsync_WithAnnotatorAsReviewer_ThrowsForbiddenException()
    {
        // Arrange
        var dataItem = MakeDataItem(1, DataItemStatus.Submitted);
        var annotator = MakeUser(5, UserRole.Annotator);

        _mockUow.DataItems.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(dataItem);
        _mockUow.Users.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(annotator);

        var request = new CreateReviewRequest { Decision = ReviewDecision.Approved };

        // Act
        var act = () => _sut.CreateReviewAsync(1, request, reviewerId: 5);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task CreateReviewAsync_RejectedWithoutFeedback_ThrowsValidationException()
    {
        // Arrange
        var dataItem = MakeDataItem(1, DataItemStatus.Submitted);
        var reviewer = MakeUser(10, UserRole.Reviewer);

        _mockUow.DataItems.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(dataItem);
        _mockUow.Users.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(reviewer);

        var request = new CreateReviewRequest
        {
            Decision = ReviewDecision.Rejected,
            Feedback = null, // missing feedback
            ErrorTypeIds = new[] { 1 }
        };

        // Act
        var act = () => _sut.CreateReviewAsync(1, request, reviewerId: 10);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*Feedback is required*");
    }

    [Fact]
    public async Task CreateReviewAsync_RejectedWithoutErrorTypes_ThrowsValidationException()
    {
        // Arrange
        var dataItem = MakeDataItem(1, DataItemStatus.Submitted);
        var reviewer = MakeUser(10, UserRole.Reviewer);

        _mockUow.DataItems.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(dataItem);
        _mockUow.Users.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(reviewer);

        var request = new CreateReviewRequest
        {
            Decision = ReviewDecision.Rejected,
            Feedback = "Has errors.",
            ErrorTypeIds = Array.Empty<int>() // no error types
        };

        // Act
        var act = () => _sut.CreateReviewAsync(1, request, reviewerId: 10);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*error type*");
    }
}
