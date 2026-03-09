using DataLabeling.Application.DTOs.Annotations;
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
/// Unit tests for AnnotationService - SaveAllAsync transaction behavior.
/// </summary>
[Trait("Category", "Unit")]
public class AnnotationServiceTests
{
    private readonly MockUnitOfWork _mockUow;
    private readonly Mock<IActivityLogService> _mockActivityLog;
    private readonly AnnotationService _sut;

    private static DataItem MakeDataItem(int id, int datasetId = 1) => new()
    {
        Id = id,
        DatasetId = datasetId,
        FileName = $"image{id}.jpg",
        FilePath = $"/uploads/1/{datasetId}/image{id}.jpg",
        Status = DataItemStatus.Pending
    };

    private static Dataset MakeDataset(int id, int projectId = 1) => new()
    {
        Id = id,
        ProjectId = projectId
    };

    private static Label MakeLabel(int id, int projectId = 1) => new()
    {
        Id = id,
        ProjectId = projectId,
        Name = $"Label {id}",
        Color = "#FF0000"
    };

    public AnnotationServiceTests()
    {
        _mockUow = new MockUnitOfWork();
        _mockActivityLog = new Mock<IActivityLogService>();
        _mockActivityLog
            .Setup(l => l.LogAsync(It.IsAny<int>(), It.IsAny<ActivityAction>(), It.IsAny<string>(),
                It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _sut = new AnnotationService(_mockUow.Object, _mockActivityLog.Object);
    }

    private void SetupValidDataItemAndLabels(int dataItemId = 1, int datasetId = 1, int projectId = 1, params int[] labelIds)
    {
        var dataItem = MakeDataItem(dataItemId, datasetId);
        var dataset = MakeDataset(datasetId, projectId);
        var labels = labelIds.Select(id => MakeLabel(id, projectId)).ToList();

        _mockUow.DataItems.Setup(r => r.GetByIdAsync(dataItemId, It.IsAny<CancellationToken>())).ReturnsAsync(dataItem);
        _mockUow.Datasets.Setup(r => r.GetByIdAsync(datasetId, It.IsAny<CancellationToken>())).ReturnsAsync(dataset);
        _mockUow.Labels.Setup(r => r.GetByProjectIdAsync(projectId, It.IsAny<CancellationToken>())).ReturnsAsync(labels);
        _mockUow.Annotations
            .Setup(r => r.GetByDataItemIdWithLabelAsync(dataItemId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Annotation>());
    }

    // ==================== SaveAllAsync - Transaction ====================

    [Fact]
    public async Task SaveAllAsync_HappyPath_BeginsAndCommitsTransaction()
    {
        // Arrange
        SetupValidDataItemAndLabels(labelIds: new[] { 1, 2 });
        var request = new SaveAnnotationsRequest
        {
            Annotations = new List<AnnotationItem>
            {
                new() { LabelId = 1, Coordinates = "{\"x\":10}" },
                new() { LabelId = 2, Coordinates = "{\"x\":20}" }
            }
        };

        // Act
        await _sut.SaveAllAsync(1, request, createdById: 5);

        // Assert
        _mockUow.Mock.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUow.Mock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUow.Mock.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SaveAllAsync_WhenSaveChangesFails_RollsBackTransaction()
    {
        // Arrange
        SetupValidDataItemAndLabels(labelIds: new[] { 1 });
        _mockUow.Mock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("DB error"));

        var request = new SaveAnnotationsRequest
        {
            Annotations = new List<AnnotationItem>
            {
                new() { LabelId = 1, Coordinates = "{\"x\":10}" }
            }
        };

        // Act
        var act = () => _sut.SaveAllAsync(1, request, createdById: 5);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("DB error");
        _mockUow.Mock.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUow.Mock.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUow.Mock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SaveAllAsync_WhenAddRangeFails_RollsBackAndDeleteIsNotPersisted()
    {
        // Arrange
        SetupValidDataItemAndLabels(labelIds: new[] { 1 });
        _mockUow.Annotations
            .Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<Annotation>>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("AddRange failed"));

        var request = new SaveAnnotationsRequest
        {
            Annotations = new List<AnnotationItem>
            {
                new() { LabelId = 1, Coordinates = "{\"x\":10}" }
            }
        };

        // Act
        var act = () => _sut.SaveAllAsync(1, request, createdById: 5);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("AddRange failed");
        _mockUow.Mock.Verify(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUow.Mock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
        // SaveChanges should NOT have been called since AddRange failed before it
        _mockUow.Mock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SaveAllAsync_OnlySavesOnce_WithinTransaction()
    {
        // Arrange
        SetupValidDataItemAndLabels(labelIds: new[] { 1, 2 });
        var request = new SaveAnnotationsRequest
        {
            Annotations = new List<AnnotationItem>
            {
                new() { LabelId = 1, Coordinates = "{\"x\":10}" },
                new() { LabelId = 2, Coordinates = "{\"x\":20}" }
            }
        };

        // Act
        await _sut.SaveAllAsync(1, request, createdById: 5);

        // Assert - only 1 SaveChangesAsync within the transaction (not 2 like before)
        _mockUow.Mock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SaveAllAsync_DeletesExistingAndAddsNew_InSameTransaction()
    {
        // Arrange
        SetupValidDataItemAndLabels(labelIds: new[] { 1 });
        var deleteCallOrder = 0;
        var addCallOrder = 0;
        var saveCallOrder = 0;
        var commitCallOrder = 0;
        var callCounter = 0;

        _mockUow.Annotations
            .Setup(r => r.DeleteByDataItemIdAsync(1, It.IsAny<CancellationToken>()))
            .Callback(() => deleteCallOrder = ++callCounter)
            .Returns(Task.CompletedTask);
        _mockUow.Annotations
            .Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<Annotation>>(), It.IsAny<CancellationToken>()))
            .Callback(() => addCallOrder = ++callCounter)
            .Returns(Task.CompletedTask);
        _mockUow.Mock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .Callback(() => saveCallOrder = ++callCounter)
            .ReturnsAsync(1);
        _mockUow.Mock
            .Setup(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()))
            .Callback(() => commitCallOrder = ++callCounter)
            .Returns(Task.CompletedTask);

        var request = new SaveAnnotationsRequest
        {
            Annotations = new List<AnnotationItem>
            {
                new() { LabelId = 1, Coordinates = "{\"x\":10}" }
            }
        };

        // Act
        await _sut.SaveAllAsync(1, request, createdById: 5);

        // Assert - order: delete → add → save → commit
        deleteCallOrder.Should().BeLessThan(addCallOrder);
        addCallOrder.Should().BeLessThan(saveCallOrder);
        saveCallOrder.Should().BeLessThan(commitCallOrder);
    }

    [Fact]
    public async Task SaveAllAsync_WithEmptyAnnotations_StillUsesTransaction()
    {
        // Arrange
        SetupValidDataItemAndLabels(labelIds: new[] { 1 });
        var request = new SaveAnnotationsRequest
        {
            Annotations = new List<AnnotationItem>() // empty list
        };

        // Act
        await _sut.SaveAllAsync(1, request, createdById: 5);

        // Assert
        _mockUow.Mock.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUow.Mock.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUow.Annotations.Verify(r => r.DeleteByDataItemIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
        _mockUow.Annotations.Verify(r => r.AddRangeAsync(It.IsAny<IEnumerable<Annotation>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ==================== UpdateAsync - Null checks ====================

    [Fact]
    public async Task UpdateAsync_WithNullDataItem_ThrowsNotFoundException()
    {
        // Arrange
        var annotation = new Annotation { Id = 1, DataItemId = 99, CreatedById = 5, Coordinates = "{}" };
        _mockUow.Annotations.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(annotation);
        _mockUow.Labels.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(MakeLabel(1));
        _mockUow.DataItems.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((DataItem?)null);

        var request = new UpdateAnnotationRequest { LabelId = 1 };

        // Act
        var act = () => _sut.UpdateAsync(1, request, userId: 5);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*DataItem*");
    }

    [Fact]
    public async Task UpdateAsync_WithNullDataset_ThrowsNotFoundException()
    {
        // Arrange
        var annotation = new Annotation { Id = 1, DataItemId = 1, CreatedById = 5, Coordinates = "{}" };
        var dataItem = MakeDataItem(1, datasetId: 99);

        _mockUow.Annotations.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(annotation);
        _mockUow.Labels.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(MakeLabel(1));
        _mockUow.DataItems.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(dataItem);
        _mockUow.Datasets.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((Dataset?)null);

        var request = new UpdateAnnotationRequest { LabelId = 1 };

        // Act
        var act = () => _sut.UpdateAsync(1, request, userId: 5);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*Dataset*");
    }

    // ==================== SaveAllAsync - Validation (before transaction) ====================

    [Fact]
    public async Task SaveAllAsync_WithNonExistentDataItem_ThrowsNotFoundAndNoTransaction()
    {
        // Arrange
        _mockUow.DataItems.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((DataItem?)null);
        var request = new SaveAnnotationsRequest { Annotations = new List<AnnotationItem>() };

        // Act
        var act = () => _sut.SaveAllAsync(99, request, createdById: 5);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _mockUow.Mock.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SaveAllAsync_WithInvalidLabel_ThrowsValidationAndNoTransaction()
    {
        // Arrange
        SetupValidDataItemAndLabels(labelIds: new[] { 1, 2 }); // only labels 1, 2 exist
        var request = new SaveAnnotationsRequest
        {
            Annotations = new List<AnnotationItem>
            {
                new() { LabelId = 999, Coordinates = "{}" } // invalid label
            }
        };

        // Act
        var act = () => _sut.SaveAllAsync(1, request, createdById: 5);

        // Assert
        await act.Should().ThrowAsync<ValidationException>().WithMessage("*Label 999*");
        _mockUow.Mock.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
