namespace DataLabeling.Application.DTOs.Tasks;

/// <summary>
/// Result DTO for task assignment operations.
/// </summary>
public class TaskAssignmentResultDto
{
    /// <summary>
    /// The task that was created or modified.
    /// </summary>
    public TaskDto Task { get; set; } = null!;

    /// <summary>
    /// Number of items successfully assigned.
    /// </summary>
    public int AssignedCount { get; set; }

    /// <summary>
    /// Number of items that were skipped (already assigned or invalid).
    /// </summary>
    public int SkippedCount { get; set; }

    /// <summary>
    /// Details about skipped items.
    /// </summary>
    public List<SkippedItemDto> SkippedItems { get; set; } = new();
}

/// <summary>
/// Information about a skipped item during assignment.
/// </summary>
public class SkippedItemDto
{
    /// <summary>
    /// Data item ID that was skipped.
    /// </summary>
    public int DataItemId { get; set; }

    /// <summary>
    /// Reason why the item was skipped.
    /// </summary>
    public string Reason { get; set; } = string.Empty;
}
