using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.Tasks;

/// <summary>
/// Request DTO for creating a new annotation task.
/// </summary>
public class CreateTaskRequest
{
    /// <summary>
    /// Project ID to create task for.
    /// </summary>
    public int ProjectId { get; set; }

    /// <summary>
    /// Annotator ID to assign the task to.
    /// </summary>
    public int AnnotatorId { get; set; }

    /// <summary>
    /// Reviewer ID to assign for reviewing this task.
    /// Required field.
    /// </summary>
    public int ReviewerId { get; set; }

    /// <summary>
    /// Deadline for completing this task.
    /// Required field.
    /// </summary>
    public DateTime Deadline { get; set; }

    /// <summary>
    /// Priority level for this task.
    /// Defaults to Medium when not specified.
    /// </summary>
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    /// <summary>
    /// List of data item IDs to include in this task.
    /// If empty, no items will be assigned initially.
    /// </summary>
    public int[] DataItemIds { get; set; } = Array.Empty<int>();
}
