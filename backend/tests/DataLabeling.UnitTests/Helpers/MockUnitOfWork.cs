using DataLabeling.Core.Interfaces;
using DataLabeling.Core.Interfaces.Repositories;
using Moq;

namespace DataLabeling.UnitTests.Helpers;

/// <summary>
/// Helper that provides pre-configured Moq mocks for IUnitOfWork and its repositories.
/// </summary>
public class MockUnitOfWork
{
    public Mock<IUnitOfWork> Mock { get; } = new Mock<IUnitOfWork>();
    public Mock<IUserRepository> Users { get; } = new Mock<IUserRepository>();
    public Mock<IProjectRepository> Projects { get; } = new Mock<IProjectRepository>();
    public Mock<IDatasetRepository> Datasets { get; } = new Mock<IDatasetRepository>();
    public Mock<IAnnotationTaskRepository> AnnotationTasks { get; } = new Mock<IAnnotationTaskRepository>();
    public Mock<IAnnotationRepository> Annotations { get; } = new Mock<IAnnotationRepository>();
    public Mock<IReviewRepository> Reviews { get; } = new Mock<IReviewRepository>();
    public Mock<IErrorTypeRepository> ErrorTypes { get; } = new Mock<IErrorTypeRepository>();
    public Mock<INotificationRepository> Notifications { get; } = new Mock<INotificationRepository>();
    public Mock<IActivityLogRepository> ActivityLogs { get; } = new Mock<IActivityLogRepository>();
    public Mock<IDataItemRepository> DataItems { get; } = new Mock<IDataItemRepository>();
    public Mock<ITaskItemRepository> TaskItems { get; } = new Mock<ITaskItemRepository>();
    public Mock<ILabelRepository> Labels { get; } = new Mock<ILabelRepository>();

    public IUnitOfWork Object => Mock.Object;

    public MockUnitOfWork()
    {
        Mock.Setup(u => u.Users).Returns(Users.Object);
        Mock.Setup(u => u.Projects).Returns(Projects.Object);
        Mock.Setup(u => u.Datasets).Returns(Datasets.Object);
        Mock.Setup(u => u.AnnotationTasks).Returns(AnnotationTasks.Object);
        Mock.Setup(u => u.Annotations).Returns(Annotations.Object);
        Mock.Setup(u => u.Reviews).Returns(Reviews.Object);
        Mock.Setup(u => u.ErrorTypes).Returns(ErrorTypes.Object);
        Mock.Setup(u => u.Notifications).Returns(Notifications.Object);
        Mock.Setup(u => u.ActivityLogs).Returns(ActivityLogs.Object);
        Mock.Setup(u => u.DataItems).Returns(DataItems.Object);
        Mock.Setup(u => u.TaskItems).Returns(TaskItems.Object);
        Mock.Setup(u => u.Labels).Returns(Labels.Object);
        Mock.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        Mock.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock.Setup(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock.Setup(u => u.RollbackTransactionAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
    }
}
