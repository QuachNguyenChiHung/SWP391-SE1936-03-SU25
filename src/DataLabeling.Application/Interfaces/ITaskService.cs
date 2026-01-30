using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Tasks;
using DataLabeling.Core.Enums;

namespace DataLabeling.Application.Interfaces;

/// <summary>
/// Service interface for annotation task operations.
/// </summary>
public interface ITaskService
{
    /// <summary>
    /// Creates a new annotation task and assigns it to an annotator.
    /// </summary>
    Task<TaskAssignmentResultDto> CreateTaskAsync(
        CreateTaskRequest request,
        int assignedById,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Assigns additional data items to an existing task.
    /// </summary>
    Task<TaskAssignmentResultDto> AssignItemsAsync(
        int taskId,
        AssignItemsRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes items from a task (only if not yet started).
    /// </summary>
    Task<int> RemoveItemsAsync(
        int taskId,
        int[] dataItemIds,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a task (only if not started or in progress).
    /// </summary>
    Task DeleteTaskAsync(int taskId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a task by ID with full details.
    /// </summary>
    Task<TaskDetailDto?> GetTaskByIdAsync(int taskId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets paginated list of tasks with filtering.
    /// </summary>
    Task<PagedResult<TaskDto>> GetTasksAsync(
        int pageNumber,
        int pageSize,
        int? projectId = null,
        int? annotatorId = null,
        AnnotationTaskStatus? status = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets unassigned data items for a project (items that can be assigned to tasks).
    /// </summary>
    Task<PagedResult<UnassignedItemDto>> GetUnassignedItemsAsync(
        int projectId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets available annotators for task assignment.
    /// </summary>
    Task<IEnumerable<AnnotatorDto>> GetAvailableAnnotatorsAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// DTO for unassigned data items.
/// </summary>
public class UnassignedItemDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? ThumbnailPath { get; set; }
    public int? FileSizeKB { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for annotator selection.
/// </summary>
public class AnnotatorDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int ActiveTaskCount { get; set; }
}
