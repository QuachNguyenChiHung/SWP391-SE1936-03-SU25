using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.Tasks;

/// <summary>
/// Represents a single data item in the annotator's work history.
/// </summary>
public class MyWorkItemDto
{
    public int TaskItemId { get; set; }
    public int TaskId { get; set; }
    public int DataItemId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? ThumbnailPath { get; set; }
    public DataItemStatus Status { get; set; }
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Populated only when Status = Rejected
    public string? Feedback { get; set; }
    public List<string> ErrorTypes { get; set; } = new();
}
