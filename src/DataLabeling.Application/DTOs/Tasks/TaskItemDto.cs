using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.Tasks;

/// <summary>
/// Task item DTO - represents an item within a task.
/// </summary>
public class TaskItemDto
{
    public int Id { get; set; }
    public int DataItemId { get; set; }
    public string FileName { get; set; } = default!;
    public string FilePath { get; set; } = default!;
    public string? ThumbnailPath { get; set; }
    public TaskItemStatus Status { get; set; }
    public DataItemStatus DataItemStatus { get; set; }
    public DateTime AssignedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
