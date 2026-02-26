namespace DataLabeling.Core.Entities;

/// <summary>
/// Label entity - defines label types for a project.
/// Example: "Car", "Person", "Traffic Light"
/// </summary>
public class Label : BaseEntity
{
    /// <summary>
    /// Foreign key to the project.
    /// </summary>
    public int ProjectId { get; set; }

    /// <summary>
    /// Label name - must be unique within project.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Display color in hex format (#RRGGBB).
    /// Example: "#FF5733"
    /// </summary>
    public required string Color { get; set; }

    /// <summary>
    /// Keyboard shortcut (single character A-Z, 0-9).
    /// Must be unique within project.
    /// </summary>
    public char? Shortcut { get; set; }

    /// <summary>
    /// Description of what this label represents.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Display order in the UI.
    /// </summary>
    public int DisplayOrder { get; set; } = 0;

    // ==================== Navigation Properties ====================

    /// <summary>
    /// Project this label belongs to.
    /// </summary>
    public virtual Project Project { get; set; } = null!;

    /// <summary>
    /// Annotations using this label.
    /// </summary>
    public virtual ICollection<Annotation> Annotations { get; set; } = new List<Annotation>();
}
