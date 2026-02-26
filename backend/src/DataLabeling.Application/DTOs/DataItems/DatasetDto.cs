namespace DataLabeling.Application.DTOs.DataItems;

/// <summary>
/// DTO for Dataset information.
/// </summary>
public class DatasetDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public int TotalItems { get; set; }
    public decimal TotalSizeMB { get; set; }
    public DateTime CreatedAt { get; set; }
}
