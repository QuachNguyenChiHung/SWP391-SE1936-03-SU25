using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Entities;

/// <summary>
/// Project entity - represents a labeling project.
/// </summary>
public class Project : BaseEntity
{
    /// <summary>
    /// Project name.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Project description (optional).
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Type of labeling (Classification, ObjectDetection, Segmentation).
    /// </summary>
    public ProjectType Type { get; set; }

    /// <summary>
    /// Project status (Draft, Active, Completed, Archived).
    /// </summary>
    public ProjectStatus Status { get; set; } = ProjectStatus.Draft;

    /// <summary>
    /// Project deadline (optional).
    /// </summary>
    public DateOnly? Deadline { get; set; }

    /// <summary>
    /// Foreign key to the user who created this project.
    /// </summary>
    public int CreatedById { get; set; }

    // ==================== Navigation Properties ====================

    /// <summary>
    /// User who created this project (Manager/Admin).
    /// </summary>
    public virtual User CreatedBy { get; set; } = null!;

    /// <summary>
    /// Dataset associated with this project (1:1).
    /// </summary>
    public virtual Dataset? Dataset { get; set; }

    /// <summary>
    /// Guideline associated with this project (1:1).
    /// </summary>
    public virtual Guideline? Guideline { get; set; }

    /// <summary>
    /// Labels defined for this project.
    /// </summary>
    public virtual ICollection<Label> Labels { get; set; } = new List<Label>();

    /// <summary>
    /// Tasks created for this project.
    /// </summary>
    public virtual ICollection<AnnotationTask> Tasks { get; set; } = new List<AnnotationTask>();
}
