namespace DataLabeling.Application.DTOs.DataItems;

/// <summary>
/// DTO for upload operation result.
/// </summary>
public class UploadResultDto
{
    public int UploadedCount { get; set; }
    public int FailedCount { get; set; }
    public decimal TotalSizeMB { get; set; }
    public IEnumerable<DataItemDto> Items { get; set; } = new List<DataItemDto>();
    public IEnumerable<FailedFileDto> FailedFiles { get; set; } = new List<FailedFileDto>();
}

/// <summary>
/// DTO for failed file upload information.
/// </summary>
public class FailedFileDto
{
    public string FileName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}
