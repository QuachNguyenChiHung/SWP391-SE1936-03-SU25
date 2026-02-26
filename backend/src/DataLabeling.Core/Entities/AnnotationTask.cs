using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Entities;

/// <summary>
/// AnnotationTask entity - represents a work assignment for an annotator.
/// Named AnnotationTask (not Task) to avoid conflict with System.Threading.Tasks.Task.
/// </summary>
public class AnnotationTask : BaseEntity
{
    /// <summary>
    /// Foreign key to the project.
    /// </summary>
    public int ProjectId { get; set; }

    /// <summary>
    /// Foreign key to the annotator (User with Role = Annotator).
    /// </summary>
    public int AnnotatorId { get; set; }

    /// <summary>
    /// Foreign key to the user who assigned this task (Manager/Admin).
    /// </summary>
    public int AssignedById { get; set; }

    /// <summary>
    /// Current task status.
    /// </summary>
    public AnnotationTaskStatus Status { get; set; } = AnnotationTaskStatus.Assigned;

    /// <summary>
    /// Total number of items in this task.
    /// </summary>
    public int TotalItems { get; set; } = 0;

    /// <summary>
    /// Number of items completed by the annotator.
    /// </summary>
    public int CompletedItems { get; set; } = 0;

    /// <summary>
    /// When the task was assigned.
    /// </summary>
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the annotator submitted the task for review.
    /// </summary>
    public DateTime? SubmittedAt { get; set; }

    /// <summary>
    /// When all items in the task were approved.
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    // ==================== Computed Properties ====================

    /// <summary>
    /// Progress percentage (0-100).
    /// </summary>
    public double ProgressPercent => TotalItems > 0 ? (double)CompletedItems / TotalItems * 100 : 0;

    // ==================== Navigation Properties ====================

    /// <summary>
    /// Project this task belongs to.
    /// </summary>
    public virtual Project Project { get; set; } = null!;

    /// <summary>
    /// Annotator assigned to this task.
    /// </summary>
    public virtual User Annotator { get; set; } = null!;

    /// <summary>
    /// Manager who assigned this task.
    /// </summary>
    public virtual User AssignedBy { get; set; } = null!;

    /// <summary>
    /// Items in this task.
    /// </summary>
    public virtual ICollection<TaskItem> TaskItems { get; set; } = new List<TaskItem>();
}
