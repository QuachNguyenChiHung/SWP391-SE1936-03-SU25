namespace DataLabeling.Core.Entities;

/// <summary>
/// Annotation entity - represents a label drawn on a data item.
/// Contains coordinates (bounding box, polygon) stored as JSON.
/// </summary>
public class Annotation : BaseEntity
{
    /// <summary>
    /// Foreign key to the data item.
    /// </summary>
    public int DataItemId { get; set; }

    /// <summary>
    /// Foreign key to the label.
    /// </summary>
    public int LabelId { get; set; }

    /// <summary>
    /// Foreign key to the user who created this annotation.
    /// </summary>
    public int CreatedById { get; set; }

    /// <summary>
    /// Coordinates stored as JSON string.
    /// 
    /// For Bounding Box:
    /// {"type":"bbox","x":100,"y":200,"width":150,"height":100}
    /// 
    /// For Polygon:
    /// {"type":"polygon","points":[{"x":100,"y":100},{"x":200,"y":100},{"x":200,"y":200}]}
    /// 
    /// For Classification:
    /// {"type":"classification"}
    /// </summary>
    public required string Coordinates { get; set; }

    /// <summary>
    /// Additional attributes as JSON (optional).
    /// Example: {"occluded":false,"truncated":false,"difficult":false}
    /// </summary>
    public string? Attributes { get; set; }

    // ==================== Navigation Properties ====================

    /// <summary>
    /// Data item this annotation belongs to.
    /// </summary>
    public virtual DataItem DataItem { get; set; } = null!;

    /// <summary>
    /// Label used for this annotation.
    /// </summary>
    public virtual Label Label { get; set; } = null!;

    /// <summary>
    /// User who created this annotation.
    /// </summary>
    public virtual User CreatedBy { get; set; } = null!;
}
