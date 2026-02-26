using AutoMapper;
using DataLabeling.Application.DTOs.Tasks;
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
/// Unit tests for TaskService - task creation and assignment logic.
/// </summary>
[Trait("Category", "Unit")]
public class TaskServiceTests
{
    private readonly MockUnitOfWork _mockUow;
    private readonly Mock<IMapper> _mockMapper;
    private readonly Mock<IActivityLogService> _mockActivityLog;
    private readonly TaskService _sut;

    public TaskServiceTests()
    {
        _mockUow = new MockUnitOfWork();
        _mockMapper = new Mock<IMapper>();
        _mockActivityLog = new Mock<IActivityLogService>();
        _mockActivityLog
            .Setup(l => l.LogAsync(It.IsAny<int>(), It.IsAny<ActivityAction>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _sut = new TaskService(_mockUow.Object, _mockMapper.Object, _mockActivityLog.Object);
    }

    // ==================== CreateTaskAsync Tests ====================

    [Fact]
    public async Task CreateTaskAsync_WithNonExistentProject_ThrowsNotFoundException()
    {
        // Arrange
        _mockUow.Projects
            .Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Project?)null);

        var request = new CreateTaskRequest { ProjectId = 99, AnnotatorId = 1 };

        // Act
        var act = () => _sut.CreateTaskAsync(request, assignedById: 1);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*Project*");
    }

    [Fact]
    public async Task CreateTaskAsync_WithNonExistentAnnotator_ThrowsNotFoundException()
    {
        // Arrange
        var project = new Project
        {
            Id = 1, Name = "Test Project", CreatedById = 1,
            Status = ProjectStatus.Active, Type = ProjectType.ObjectDetection
        };

        _mockUow.Projects.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(project);
        _mockUow.Users.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        var request = new CreateTaskRequest { ProjectId = 1, AnnotatorId = 99 };

        // Act
        var act = () => _sut.CreateTaskAsync(request, assignedById: 1);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*Annotator*");
    }

    [Fact]
    public async Task CreateTaskAsync_WithNonAnnotatorUser_ThrowsValidationException()
    {
        // Arrange
        var project = new Project
        {
            Id = 1, Name = "Test Project", CreatedById = 1,
            Status = ProjectStatus.Active, Type = ProjectType.ObjectDetection
        };
        var manager = new User
        {
            Id = 5, Email = "manager@example.com", Name = "Manager",
            PasswordHash = "hash", Role = UserRole.Manager, Status = UserStatus.Active
        };

        _mockUow.Projects.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(project);
        _mockUow.Users.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(manager);

        var request = new CreateTaskRequest { ProjectId = 1, AnnotatorId = 5 };

        // Act
        var act = () => _sut.CreateTaskAsync(request, assignedById: 1);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*not an annotator*");
    }

    [Fact]
    public async Task CreateTaskAsync_WithInactiveAnnotator_ThrowsValidationException()
    {
        // Arrange
        var project = new Project
        {
            Id = 1, Name = "Test Project", CreatedById = 1,
            Status = ProjectStatus.Active, Type = ProjectType.ObjectDetection
        };
        var inactiveAnnotator = new User
        {
            Id = 5, Email = "annotator@example.com", Name = "Annotator",
            PasswordHash = "hash", Role = UserRole.Annotator, Status = UserStatus.Inactive
        };

        _mockUow.Projects.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(project);
        _mockUow.Users.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(inactiveAnnotator);

        var request = new CreateTaskRequest { ProjectId = 1, AnnotatorId = 5 };

        // Act
        var act = () => _sut.CreateTaskAsync(request, assignedById: 1);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*not active*");
    }

    [Fact]
    public async Task CreateTaskAsync_WithValidInputAndNoItems_CreatesEmptyTask()
    {
        // Arrange
        var project = new Project
        {
            Id = 1, Name = "Test Project", CreatedById = 1,
            Status = ProjectStatus.Active, Type = ProjectType.ObjectDetection
        };
        var annotator = new User
        {
            Id = 5, Email = "annotator@example.com", Name = "Annotator",
            PasswordHash = "hash", Role = UserRole.Annotator, Status = UserStatus.Active
        };
        var createdTask = new AnnotationTask
        {
            Id = 10, ProjectId = 1, AnnotatorId = 5, AssignedById = 1,
            Status = AnnotationTaskStatus.Assigned, TotalItems = 0, CompletedItems = 0,
            AssignedAt = DateTime.UtcNow,
            Project = project,
            Annotator = annotator,
            AssignedBy = new User { Id = 1, Name = "Manager", Email = "m@e.com", PasswordHash = "h" }
        };

        _mockUow.Projects.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(project);
        _mockUow.Users.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(annotator);
        _mockUow.AnnotationTasks
            .Setup(r => r.AddAsync(It.IsAny<AnnotationTask>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AnnotationTask t, CancellationToken _) => t);
        _mockUow.AnnotationTasks
            .Setup(r => r.GetWithDetailsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdTask);

        var taskDto = new TaskDto { Id = 10, ProjectId = 1, AnnotatorId = 5 };
        _mockMapper.Setup(m => m.Map<TaskDto>(It.IsAny<AnnotationTask>())).Returns(taskDto);

        var request = new CreateTaskRequest { ProjectId = 1, AnnotatorId = 5, DataItemIds = Array.Empty<int>() };

        // Act
        var result = await _sut.CreateTaskAsync(request, assignedById: 1);

        // Assert
        result.Should().NotBeNull();
        result.AssignedCount.Should().Be(0);
        _mockUow.AnnotationTasks.Verify(r => r.AddAsync(It.IsAny<AnnotationTask>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUow.Mock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    // ==================== AssignItemsAsync Tests ====================

    [Fact]
    public async Task AssignItemsAsync_ToCompletedTask_ThrowsValidationException()
    {
        // Arrange
        var completedTask = new AnnotationTask
        {
            Id = 10, ProjectId = 1, AnnotatorId = 5, AssignedById = 1,
            Status = AnnotationTaskStatus.Completed, TotalItems = 5, CompletedItems = 5,
            AssignedAt = DateTime.UtcNow
        };

        _mockUow.AnnotationTasks
            .Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(completedTask);

        var request = new AssignItemsRequest { DataItemIds = new[] { 1, 2 } };

        // Act
        var act = () => _sut.AssignItemsAsync(10, request);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*completed*");
    }

    [Fact]
    public async Task AssignItemsAsync_WithNonExistentTask_ThrowsNotFoundException()
    {
        // Arrange
        _mockUow.AnnotationTasks
            .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AnnotationTask?)null);

        var request = new AssignItemsRequest { DataItemIds = new[] { 1 } };

        // Act
        var act = () => _sut.AssignItemsAsync(999, request);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*Task*");
    }

    [Fact]
    public async Task AssignItemsAsync_WithEmptyDataItemIds_ThrowsValidationException()
    {
        // Arrange
        var task = new AnnotationTask
        {
            Id = 10, ProjectId = 1, AnnotatorId = 5, AssignedById = 1,
            Status = AnnotationTaskStatus.Assigned, TotalItems = 0, CompletedItems = 0,
            AssignedAt = DateTime.UtcNow
        };

        _mockUow.AnnotationTasks
            .Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(task);

        var request = new AssignItemsRequest { DataItemIds = Array.Empty<int>() };

        // Act
        var act = () => _sut.AssignItemsAsync(10, request);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*No items*");
    }
}
