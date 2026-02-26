using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.Export;

/// <summary>
/// Request DTO for exporting project annotations.
/// </summary>
public class ExportRequestDto
{
    /// <summary>
    /// Export format (COCO, YOLO, or PascalVOC).
    /// </summary>
    public ExportFormat Format { get; set; }

    /// <summary>
    /// Whether to include image files in the export.
    /// Default: true
    /// </summary>
    public bool IncludeImages { get; set; } = true;

    /// <summary>
    /// Optional filter to export only items with specific status.
    /// Default: Approved only
    /// </summary>
    public DataItemStatus? StatusFilter { get; set; } = DataItemStatus.Approved;
}
