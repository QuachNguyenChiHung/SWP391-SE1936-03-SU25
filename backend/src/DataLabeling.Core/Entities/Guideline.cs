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
    /// Guideline content as array of strings (each string is a guideline item/rule).
    /// Stored as JSON in database.
    /// </summary>
    public List<string> Content { get; set; } = new List<string>();

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
