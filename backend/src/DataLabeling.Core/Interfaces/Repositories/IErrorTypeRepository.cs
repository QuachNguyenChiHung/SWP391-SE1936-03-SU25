using DataLabeling.Core.Entities;

namespace DataLabeling.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for ErrorType entity operations.
/// Note: ErrorType does not inherit from BaseEntity, so this uses a separate interface.
/// </summary>
public interface IErrorTypeRepository
{
    /// <summary>
    /// Gets an error type by ID.
    /// </summary>
    Task<ErrorType?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets an error type by code.
    /// </summary>
    Task<ErrorType?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all error types.
    /// </summary>
    Task<IEnumerable<ErrorType>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets error types by their IDs.
    /// </summary>
    Task<IEnumerable<ErrorType>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default);
}
