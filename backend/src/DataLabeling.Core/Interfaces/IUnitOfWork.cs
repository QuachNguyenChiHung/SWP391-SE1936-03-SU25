using DataLabeling.Core.Interfaces.Repositories;

namespace DataLabeling.Core.Interfaces;

/// <summary>
/// Unit of Work pattern interface for managing transactions and repository access.
/// </summary>
public interface IUnitOfWork : IDisposable
{
    /// <summary>
    /// Gets the User repository.
    /// </summary>
    IUserRepository Users { get; }

    /// <summary>
    /// Gets the Project repository.
    /// </summary>
    IProjectRepository Projects { get; }

    /// <summary>
    /// Gets the Dataset repository.
    /// </summary>
    IDatasetRepository Datasets { get; }

    /// <summary>
    /// Gets the DataItem repository.
    /// </summary>
    IDataItemRepository DataItems { get; }

    /// <summary>
    /// Gets the Label repository.
    /// </summary>
    ILabelRepository Labels { get; }

    /// <summary>
    /// Gets the Guideline repository.
    /// </summary>
    IGuidelineRepository Guidelines { get; }

    /// <summary>
    /// Gets the AnnotationTask repository.
    /// </summary>
    IAnnotationTaskRepository AnnotationTasks { get; }

    /// <summary>
    /// Gets the TaskItem repository.
    /// </summary>
    ITaskItemRepository TaskItems { get; }

    /// <summary>
    /// Gets the Annotation repository.
    /// </summary>
    IAnnotationRepository Annotations { get; }

    /// <summary>
    /// Gets the Review repository.
    /// </summary>
    IReviewRepository Reviews { get; }

    /// <summary>
    /// Gets the ErrorType repository.
    /// </summary>
    IErrorTypeRepository ErrorTypes { get; }

    /// <summary>
    /// Gets the Notification repository.
    /// </summary>
    INotificationRepository Notifications { get; }

    /// <summary>
    /// Gets the ActivityLog repository.
    /// </summary>
    IActivityLogRepository ActivityLogs { get; }

    /// <summary>
    /// Saves all changes made in this unit of work to the database.
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Begins a new database transaction.
    /// </summary>
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Commits the current transaction.
    /// </summary>
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Rolls back the current transaction.
    /// </summary>
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
