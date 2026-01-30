using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.DataItems;

/// <summary>
/// DTO for DataItem information.
/// </summary>
public class DataItemDto
{
    public int Id { get; set; }
    public int DatasetId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? ThumbnailPath { get; set; }
    public int? FileSizeKB { get; set; }
    public DataItemStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
