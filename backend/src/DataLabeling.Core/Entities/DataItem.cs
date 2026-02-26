using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Entities;

/// <summary>
/// DataItem entity - represents an individual image to be labeled.
/// </summary>
public class DataItem : BaseEntity
{
    /// <summary>
    /// Foreign key to the dataset.
    /// </summary>
    public int DatasetId { get; set; }

    /// <summary>
    /// Original file name.
    /// </summary>
    public required string FileName { get; set; }

    /// <summary>
    /// Relative path to the file on storage.
    /// Format: /uploads/{projectId}/{datasetId}/{filename}
    /// </summary>
    public required string FilePath { get; set; }

    /// <summary>
    /// File size in kilobytes.
    /// </summary>
    public int? FileSizeKB { get; set; }

    /// <summary>
    /// Relative path to thumbnail image.
    /// Format: /uploads/{projectId}/{datasetId}/thumbnails/{filename}
    /// </summary>
    public string? ThumbnailPath { get; set; }

    /// <summary>
    /// Image width in pixels.
    /// </summary>
    public int? Width { get; set; }

    /// <summary>
    /// Image height in pixels.
    /// </summary>
    public int? Height { get; set; }

    /// <summary>
    /// Current status in the labeling workflow.
    /// </summary>
    public DataItemStatus Status { get; set; } = DataItemStatus.Pending;

    // ==================== Navigation Properties ====================

    /// <summary>
    /// Dataset this item belongs to.
    /// </summary>
    public virtual Dataset Dataset { get; set; } = null!;

    /// <summary>
    /// Task items - links to tasks this item is assigned to.
    /// </summary>
    public virtual ICollection<TaskItem> TaskItems { get; set; } = new List<TaskItem>();

    /// <summary>
    /// Annotations on this data item.
    /// </summary>
    public virtual ICollection<Annotation> Annotations { get; set; } = new List<Annotation>();

    /// <summary>
    /// Reviews for this data item.
    /// </summary>
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
}
