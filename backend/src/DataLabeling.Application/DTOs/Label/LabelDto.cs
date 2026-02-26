namespace DataLabeling.Application.DTOs.Label;

/// <summary>
/// Data transfer object for Label entity.
/// </summary>
public class LabelDto
{
    /// <summary>
    /// Label's unique identifier.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Project ID this label belongs to.
    /// </summary>
    public int ProjectId { get; set; }

    /// <summary>
    /// Label name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Display color in hex format (#RRGGBB).
    /// </summary>
    public string Color { get; set; } = string.Empty;

    /// <summary>
    /// Keyboard shortcut (single character A-Z, 0-9).
    /// </summary>
    public char? Shortcut { get; set; }

    /// <summary>
    /// Description of what this label represents.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Display order in the UI.
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// When the label was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
