using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.Export;

/// <summary>
/// Result DTO returned after export operation completes.
/// </summary>
public class ExportResultDto
{
    /// <summary>
    /// URL to download the exported ZIP file.
    /// </summary>
    public string DownloadUrl { get; set; } = string.Empty;

    /// <summary>
    /// Name of the exported file.
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Size of the exported file in bytes.
    /// </summary>
    public long FileSizeBytes { get; set; }

    /// <summary>
    /// Number of images included in the export.
    /// </summary>
    public int ImageCount { get; set; }

    /// <summary>
    /// Number of annotations included in the export.
    /// </summary>
    public int AnnotationCount { get; set; }

    /// <summary>
    /// The export format used.
    /// </summary>
    public ExportFormat Format { get; set; }

    /// <summary>
    /// Timestamp when the export was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
