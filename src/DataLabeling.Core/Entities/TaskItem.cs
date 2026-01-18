using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Entities;

/// <summary>
/// TaskItem entity - junction table linking AnnotationTask to DataItem.
/// Represents a single item within a task.
/// </summary>
public class TaskItem : BaseEntity
{
    /// <summary>
    /// Foreign key to the task.
    /// </summary>
    public int TaskId { get; set; }

    /// <summary>
    /// Foreign key to the data item.
    /// </summary>
    public int DataItemId { get; set; }

    /// <summary>
    /// Status of this item within the task.
    /// </summary>
    public TaskItemStatus Status { get; set; } = TaskItemStatus.Assigned;

    /// <summary>
    /// When this item was assigned to the task.
    /// </summary>
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the annotator started working on this item.
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// When the annotator finished this item.
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    // ==================== Navigation Properties ====================

    /// <summary>
    /// Task this item belongs to.
    /// </summary>
    public virtual AnnotationTask Task { get; set; } = null!;

    /// <summary>
    /// Data item being worked on.
    /// </summary>
    public virtual DataItem DataItem { get; set; } = null!;
}
