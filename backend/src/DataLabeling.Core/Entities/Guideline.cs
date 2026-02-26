namespace DataLabeling.Core.Entities;

/// <summary>
/// Guideline entity - labeling guidelines for a project.
/// Has 1:1 relationship with Project.
/// </summary>
public class Guideline : BaseEntity
{
    /// <summary>
    /// Foreign key to the project.
    /// </summary>
    public int ProjectId { get; set; }

    /// <summary>
    /// Guideline content in HTML or Markdown format (for text input).
    /// </summary>
    public string? Content { get; set; }

    /// <summary>
    /// File path if guideline is uploaded as file (PDF, DOCX, etc.)
    /// </summary>
    public string? FilePath { get; set; }

    /// <summary>
    /// Original file name when uploaded
    /// </summary>
    public string? FileName { get; set; }

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long? FileSize { get; set; }

    /// <summary>
    /// MIME type (e.g., application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document)
    /// </summary>
    public string? ContentType { get; set; }

    /// <summary>
    /// Version number - increments each time content is updated.
    /// </summary>
    public int Version { get; set; } = 1;

    // ==================== Navigation Properties ====================

    /// <summary>
    /// Project this guideline belongs to.
    /// </summary>
    public virtual Project Project { get; set; } = null!;
}
