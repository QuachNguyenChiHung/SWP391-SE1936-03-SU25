namespace DataLabeling.Application.DTOs.Annotations;

/// <summary>
/// Request DTO for saving all annotations for a data item (batch operation).
/// This replaces all existing annotations with the new set.
/// </summary>
public class SaveAnnotationsRequest
{
    /// <summary>
    /// List of annotations to save.
    /// Existing annotations will be deleted and replaced with this list.
    /// </summary>
    public List<AnnotationItem> Annotations { get; set; } = new();
}

/// <summary>
/// Single annotation item in batch save request.
/// </summary>
public class AnnotationItem
{
    /// <summary>
    /// Optional ID for existing annotation (for tracking on client).
    /// If provided and exists, will be updated. Otherwise creates new.
    /// </summary>
    public int? Id { get; set; }

    /// <summary>
    /// Label ID for this annotation.
    /// </summary>
    public int LabelId { get; set; }

    /// <summary>
    /// Coordinates as JSON string.
    /// </summary>
    public string Coordinates { get; set; } = string.Empty;

    /// <summary>
    /// Optional attributes as JSON.
    /// </summary>
    public string? Attributes { get; set; }
}
