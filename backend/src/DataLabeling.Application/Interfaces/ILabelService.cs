using DataLabeling.Application.DTOs.Label;

namespace DataLabeling.Application.Interfaces;

/// <summary>
/// Service interface for Label operations.
/// </summary>
public interface ILabelService
{
    /// <summary>
    /// Gets all labels for a specific project, ordered by DisplayOrder.
    /// </summary>
    /// <param name="projectId">The project ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Collection of labels.</returns>
    Task<IEnumerable<LabelDto>> GetByProjectIdAsync(int projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a label by ID.
    /// </summary>
    /// <param name="id">The label ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The label DTO.</returns>
    Task<LabelDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new label for a project.
    /// </summary>
    /// <param name="projectId">The project ID.</param>
    /// <param name="request">The create label request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created label DTO.</returns>
    Task<LabelDto> CreateAsync(int projectId, CreateLabelRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing label.
    /// </summary>
    /// <param name="id">The label ID.</param>
    /// <param name="request">The update label request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated label DTO.</returns>
    Task<LabelDto> UpdateAsync(int id, UpdateLabelRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a label.
    /// </summary>
    /// <param name="id">The label ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Reorders labels for a project.
    /// </summary>
    /// <param name="projectId">The project ID.</param>
    /// <param name="labelIds">Array of label IDs in the desired order.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task ReorderAsync(int projectId, int[] labelIds, CancellationToken cancellationToken = default);
}
