namespace DataLabeling.Application.DTOs.Annotations;

/// <summary>
/// Response DTO for annotation.
/// </summary>
public class AnnotationDto
{
    public int Id { get; set; }
    public int DataItemId { get; set; }
    public int LabelId { get; set; }
    public string LabelName { get; set; } = string.Empty;
    public string LabelColor { get; set; } = string.Empty;
    public int CreatedById { get; set; }
    public string CreatedByName { get; set; } = string.Empty;

    /// <summary>
    /// Coordinates as JSON string.
    /// BBox: {"type":"bbox","x":100,"y":200,"width":150,"height":100}
    /// Polygon: {"type":"polygon","points":[{"x":100,"y":100},{"x":200,"y":100},...]}
    /// Classification: {"type":"classification"}
    /// </summary>
    public string Coordinates { get; set; } = string.Empty;

    /// <summary>
    /// Optional attributes as JSON.
    /// Example: {"occluded":false,"truncated":false}
    /// </summary>
    public string? Attributes { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
