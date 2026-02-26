namespace DataLabeling.Application.DTOs.Reviews;

/// <summary>
/// DTO for data item pending review.
/// </summary>
public class PendingReviewItemDto
{
    public int Id { get; set; }
    public int DatasetId { get; set; }
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? ThumbnailPath { get; set; }
    public int AnnotationCount { get; set; }
    public string AnnotatorName { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
}

/// <summary>
/// DTO for review editor - contains all data needed to review an image.
/// </summary>
public class ReviewEditorDto
{
    public int DataItemId { get; set; }
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;

    /// <summary>
    /// Annotations on this image.
    /// </summary>
    public List<ReviewAnnotationDto> Annotations { get; set; } = new();

    /// <summary>
    /// Available error types for rejection.
    /// </summary>
    public List<ErrorTypeDto> ErrorTypes { get; set; } = new();

    /// <summary>
    /// Previous reviews on this item (if any).
    /// </summary>
    public List<ReviewDto> PreviousReviews { get; set; } = new();

    /// <summary>
    /// Navigation info.
    /// </summary>
    public ReviewNavigationDto? Navigation { get; set; }
}

/// <summary>
/// Annotation info for review editor.
/// </summary>
public class ReviewAnnotationDto
{
    public int Id { get; set; }
    public int LabelId { get; set; }
    public string LabelName { get; set; } = string.Empty;
    public string LabelColor { get; set; } = string.Empty;
    public string Coordinates { get; set; } = string.Empty;
    public string? Attributes { get; set; }
}

/// <summary>
/// Navigation info for review editor.
/// </summary>
public class ReviewNavigationDto
{
    public int? PreviousDataItemId { get; set; }
    public int? NextDataItemId { get; set; }
    public int CurrentIndex { get; set; }
    public int TotalItems { get; set; }
}
