using Microsoft.EntityFrameworkCore.Storage;
using DataLabeling.Core.Interfaces;
using DataLabeling.Core.Interfaces.Repositories;
using DataLabeling.Infrastructure.Data;

namespace DataLabeling.Infrastructure.Repositories;

/// <summary>
/// Unit of Work implementation for managing transactions and repository access.
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IDbContextTransaction? _currentTransaction;
    private bool _disposed;

    // Lazy-loaded repositories
    private IUserRepository? _users;
    private IProjectRepository? _projects;
    private IDatasetRepository? _datasets;
    private IDataItemRepository? _dataItems;
    private ILabelRepository? _labels;
    private IGuidelineRepository? _guidelines;
    private IAnnotationTaskRepository? _annotationTasks;
    private ITaskItemRepository? _taskItems;
    private IAnnotationRepository? _annotations;
    private IReviewRepository? _reviews;
    private IErrorTypeRepository? _errorTypes;
    private INotificationRepository? _notifications;
    private IActivityLogRepository? _activityLogs;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IUserRepository Users =>
        _users ??= new UserRepository(_context);

    public IProjectRepository Projects =>
        _projects ??= new ProjectRepository(_context);

    public IDatasetRepository Datasets =>
        _datasets ??= new DatasetRepository(_context);

    public IDataItemRepository DataItems =>
        _dataItems ??= new DataItemRepository(_context);

    public ILabelRepository Labels =>
        _labels ??= new LabelRepository(_context);

    public IGuidelineRepository Guidelines =>
        _guidelines ??= new GuidelineRepository(_context);

    public IAnnotationTaskRepository AnnotationTasks =>
        _annotationTasks ??= new AnnotationTaskRepository(_context);

    public ITaskItemRepository TaskItems =>
        _taskItems ??= new TaskItemRepository(_context);

    public IAnnotationRepository Annotations =>
        _annotations ??= new AnnotationRepository(_context);

    public IReviewRepository Reviews =>
        _reviews ??= new ReviewRepository(_context);

    public IErrorTypeRepository ErrorTypes =>
        _errorTypes ??= new ErrorTypeRepository(_context);

    public INotificationRepository Notifications =>
        _notifications ??= new NotificationRepository(_context);

    public IActivityLogRepository ActivityLogs =>
        _activityLogs ??= new ActivityLogRepository(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_currentTransaction != null)
        {
            throw new InvalidOperationException("A transaction is already in progress.");
        }

        _currentTransaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_currentTransaction == null)
        {
            throw new InvalidOperationException("No transaction in progress.");
        }

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            await _currentTransaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await RollbackTransactionAsync(cancellationToken);
            throw;
        }
        finally
        {
            await _currentTransaction.DisposeAsync();
            _currentTransaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_currentTransaction == null)
        {
            throw new InvalidOperationException("No transaction in progress.");
        }

        try
        {
            await _currentTransaction.RollbackAsync(cancellationToken);
        }
        finally
        {
            await _currentTransaction.DisposeAsync();
            _currentTransaction = null;
        }
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                _currentTransaction?.Dispose();
                _context.Dispose();
            }

            _disposed = true;
        }
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }
}
