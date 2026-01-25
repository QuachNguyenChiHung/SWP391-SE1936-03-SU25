using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.Projects;

public class ProjectDto
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public ProjectType Type { get; set; }
    public ProjectStatus Status { get; set; }
    public DateOnly? Deadline { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
