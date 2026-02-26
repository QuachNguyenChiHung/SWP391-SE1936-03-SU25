namespace DataLabeling.Application.DTOs.Label;

/// <summary>
/// Request model for creating a new label.
/// </summary>
public class CreateLabelRequest
{
    /// <summary>
    /// Label name - must be unique within project.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Display color in hex format (#RRGGBB).
    /// Example: "#FF5733"
    /// </summary>
    public string Color { get; set; } = string.Empty;

    /// <summary>
    /// Keyboard shortcut (single character A-Z, 0-9).
    /// Must be unique within project.
    /// </summary>
    public char? Shortcut { get; set; }

    /// <summary>
    /// Description of what this label represents.
    /// </summary>
    public string? Description { get; set; }
}
