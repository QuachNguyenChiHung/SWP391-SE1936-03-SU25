namespace DataLabeling.Application.DTOs.Label;

/// <summary>
/// Request model for updating a label.
/// All fields are optional - only provided fields will be updated.
/// </summary>
public class UpdateLabelRequest
{
    /// <summary>
    /// Updated label name - must be unique within project.
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Updated display color in hex format (#RRGGBB).
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// Updated keyboard shortcut (single character A-Z, 0-9).
    /// </summary>
    public char? Shortcut { get; set; }

    /// <summary>
    /// Updated description.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Updated display order.
    /// </summary>
    public int? DisplayOrder { get; set; }
}
