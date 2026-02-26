using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.Reviews;

/// <summary>
/// Request DTO for creating a review.
/// </summary>
public class CreateReviewRequest
{
    /// <summary>
    /// Review decision (Approved or Rejected).
    /// </summary>
    public ReviewDecision Decision { get; set; }

    /// <summary>
    /// Feedback from reviewer.
    /// REQUIRED if Decision = Rejected.
    /// </summary>
    public string? Feedback { get; set; }

    /// <summary>
    /// Error type IDs.
    /// REQUIRED at least 1 if Decision = Rejected.
    /// </summary>
    public int[] ErrorTypeIds { get; set; } = Array.Empty<int>();
}
