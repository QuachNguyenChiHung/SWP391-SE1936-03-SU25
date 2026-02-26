using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.Tasks;

/// <summary>
/// Basic task information DTO.
/// </summary>
public class TaskDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = default!;
    public int AnnotatorId { get; set; }
    public string AnnotatorName { get; set; } = default!;
    public AnnotationTaskStatus Status { get; set; }
    public int TotalItems { get; set; }
    public int CompletedItems { get; set; }
    public double ProgressPercent { get; set; }
    public DateTime AssignedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
