using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.Reviews;

/// <summary>
/// Response DTO for review.
/// </summary>
public class ReviewDto
{
    public int Id { get; set; }
    public int DataItemId { get; set; }
    public int ReviewerId { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public ReviewDecision Decision { get; set; }
    public string? Feedback { get; set; }
    public List<ErrorTypeDto> ErrorTypes { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for error type.
/// </summary>
public class ErrorTypeDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
