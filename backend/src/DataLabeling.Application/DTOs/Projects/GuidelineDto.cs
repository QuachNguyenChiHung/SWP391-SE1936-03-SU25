namespace DataLabeling.Application.DTOs.Projects;

/// <summary>
/// Data transfer object for Guideline entity.
/// </summary>
public class GuidelineDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }

    /// <summary>
    /// Guideline content in HTML or Markdown format (for text input).
    /// </summary>
    public string? Content { get; set; }

    /// <summary>
    /// Original file name when uploaded.
    /// </summary>
    public string? FileName { get; set; }

    /// <summary>
    /// File size in bytes.
    /// </summary>
    public long? FileSize { get; set; }

    /// <summary>
    /// MIME type of the file.
    /// </summary>
    public string? ContentType { get; set; }

    /// <summary>
    /// Download URL for the guideline file.
    /// Note: This points to the authenticated download endpoint, not a public URL.
    /// </summary>
    public string? FileUrl { get; set; }

    /// <summary>
    /// Version number - increments each time content is updated.
    /// </summary>
    public int Version { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
