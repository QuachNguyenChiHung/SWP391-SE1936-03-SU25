namespace DataLabeling.Application.DTOs.Projects;

/// <summary>
/// Data transfer object for Guideline entity.
/// </summary>
public class GuidelineDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }

    /// <summary>
    /// Guideline content as array of strings (each string is a guideline item/rule).
    /// </summary>
    public List<string> Content { get; set; } = new List<string>();

    /// <summary>
    /// Version number - increments each time content is updated.
    /// </summary>
    public int Version { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
