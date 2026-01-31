using DataLabeling.Application.DTOs.Annotations;

namespace DataLabeling.Application.Interfaces;

/// <summary>
/// Service interface for annotation operations.
/// </summary>
public interface IAnnotationService
{
    // ==================== Annotation CRUD ====================

    /// <summary>
    /// Gets all annotations for a data item.
    /// </summary>
    Task<IEnumerable<AnnotationDto>> GetByDataItemIdAsync(
        int dataItemId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single annotation by ID.
    /// </summary>
    Task<AnnotationDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new annotation.
    /// </summary>
    Task<AnnotationDto> CreateAsync(
        int dataItemId,
        CreateAnnotationRequest request,
        int createdById,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing annotation.
    /// </summary>
    Task<AnnotationDto> UpdateAsync(
        int id,
        UpdateAnnotationRequest request,
        int userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes an annotation.
    /// </summary>
    Task DeleteAsync(int id, int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Saves all annotations for a data item (batch operation).
    /// Replaces existing annotations with the new set.
    /// </summary>
    Task<IEnumerable<AnnotationDto>> SaveAllAsync(
        int dataItemId,
        SaveAnnotationsRequest request,
        int createdById,
        CancellationToken cancellationToken = default);

    // ==================== Task Item Status Management ====================

    /// <summary>
    /// Starts working on a task item (marks as InProgress).
    /// </summary>
    Task<TaskItemProgressDto> StartWorkingAsync(
        int taskItemId,
        int userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Completes a task item (marks as Completed).
    /// </summary>
    Task<TaskItemProgressDto> CompleteItemAsync(
        int taskItemId,
        int userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets task item with annotations for annotation editor.
    /// </summary>
    Task<AnnotationEditorDto?> GetAnnotationEditorDataAsync(
        int taskItemId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// DTO for task item progress updates.
/// </summary>
public class TaskItemProgressDto
{
    public int TaskItemId { get; set; }
    public int TaskId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int TaskTotalItems { get; set; }
    public int TaskCompletedItems { get; set; }
    public double TaskProgressPercent { get; set; }
}

/// <summary>
/// DTO for annotation editor - contains all data needed to annotate an image.
/// </summary>
public class AnnotationEditorDto
{
    public int TaskItemId { get; set; }
    public int TaskId { get; set; }
    public int DataItemId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Labels available for this project.
    /// </summary>
    public List<LabelOptionDto> Labels { get; set; } = new();

    /// <summary>
    /// Existing annotations on this image.
    /// </summary>
    public List<AnnotationDto> Annotations { get; set; } = new();

    /// <summary>
    /// Navigation info for next/previous items.
    /// </summary>
    public NavigationDto? Navigation { get; set; }
}

/// <summary>
/// Label option for annotation editor.
/// </summary>
public class LabelOptionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public char? Shortcut { get; set; }
}

/// <summary>
/// Navigation info for annotation editor.
/// </summary>
public class NavigationDto
{
    public int? PreviousTaskItemId { get; set; }
    public int? NextTaskItemId { get; set; }
    public int CurrentIndex { get; set; }
    public int TotalItems { get; set; }
}
