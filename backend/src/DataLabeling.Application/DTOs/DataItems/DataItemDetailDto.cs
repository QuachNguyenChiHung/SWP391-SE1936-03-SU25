using DataLabeling.Application.DTOs.Annotations;
using DataLabeling.Application.DTOs.Reviews;
using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.DataItems;

/// <summary>
/// Detailed DTO for DataItem including annotations and reviews.
/// </summary>
public class DataItemDetailDto
{
    public int Id { get; set; }
    public int DatasetId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? ThumbnailPath { get; set; }
    public int? FileSizeKB { get; set; }
    public DataItemStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public IEnumerable<AnnotationDto> Annotations { get; set; } = new List<AnnotationDto>();
    public IEnumerable<ReviewDto> Reviews { get; set; } = new List<ReviewDto>();
}
