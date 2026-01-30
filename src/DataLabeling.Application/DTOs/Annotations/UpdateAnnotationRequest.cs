namespace DataLabeling.Application.DTOs.Annotations;

/// <summary>
/// Request DTO for updating an annotation.
/// </summary>
public class UpdateAnnotationRequest
{
    /// <summary>
    /// Label ID (optional - only update if provided).
    /// </summary>
    public int? LabelId { get; set; }

    /// <summary>
    /// Coordinates as JSON string (optional - only update if provided).
    /// </summary>
    public string? Coordinates { get; set; }

    /// <summary>
    /// Attributes as JSON (optional - only update if provided).
    /// </summary>
    public string? Attributes { get; set; }
}
