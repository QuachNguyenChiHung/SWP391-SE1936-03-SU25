namespace DataLabeling.Application.DTOs.Annotations;

/// <summary>
/// Request DTO for creating a single annotation.
/// </summary>
public class CreateAnnotationRequest
{
    /// <summary>
    /// Label ID to use for this annotation.
    /// </summary>
    public int LabelId { get; set; }

    /// <summary>
    /// Coordinates as JSON string.
    /// BBox: {"type":"bbox","x":100,"y":200,"width":150,"height":100}
    /// Polygon: {"type":"polygon","points":[{"x":100,"y":100},{"x":200,"y":100},...]}
    /// Classification: {"type":"classification"}
    /// </summary>
    public string Coordinates { get; set; } = string.Empty;

    /// <summary>
    /// Optional attributes as JSON.
    /// </summary>
    public string? Attributes { get; set; }
}
