namespace DataLabeling.Core.Entities;

/// <summary>
/// Guideline entity - labeling guidelines for a project.
/// Has 1:1 relationship with Project.
/// </summary>
public class Guideline : BaseEntity
{
    /// <summary>
    /// Foreign key to the project.
    /// </summary>
    public int ProjectId { get; set; }

    /// <summary>
    /// Guideline content in HTML or Markdown format.
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Version number - increments each time content is updated.
    /// </summary>
    public int Version { get; set; } = 1;

    // ==================== Navigation Properties ====================

    /// <summary>
    /// Project this guideline belongs to.
    /// </summary>
    public virtual Project Project { get; set; } = null!;
}
