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

/// <summary>
/// DTO for Annotation information.
/// </summary>
public class AnnotationDto
{
    public int Id { get; set; }
    public int LabelId { get; set; }
    public string LabelName { get; set; } = string.Empty;
    public string LabelColor { get; set; } = string.Empty;
    public string Coordinates { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int CreatedById { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
}

/// <summary>
/// DTO for Review information.
/// </summary>
public class ReviewDto
{
    public int Id { get; set; }
    public string Decision { get; set; } = string.Empty;
    public string? Feedback { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ReviewerId { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public IEnumerable<string> ErrorTypes { get; set; } = new List<string>();
}
