namespace DataLabeling.Core.Entities;

/// <summary>
/// Dataset entity - contains collection of images for a project.
/// Has 1:1 relationship with Project.
/// </summary>
public class Dataset : BaseEntity
{
    /// <summary>
    /// Foreign key to the project.
    /// </summary>
    public int ProjectId { get; set; }

    /// <summary>
    /// Total number of data items in this dataset.
    /// Updated automatically when items are added/removed.
    /// </summary>
    public int TotalItems { get; set; } = 0;

    /// <summary>
    /// Total size of all files in megabytes.
    /// </summary>
    public decimal TotalSizeMB { get; set; } = 0;

    // ==================== Navigation Properties ====================

    /// <summary>
    /// Project this dataset belongs to.
    /// </summary>
    public virtual Project Project { get; set; } = null!;

    /// <summary>
    /// Data items (images) in this dataset.
    /// </summary>
    public virtual ICollection<DataItem> DataItems { get; set; } = new List<DataItem>();
}
