using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Entities;

/// <summary>
/// Review entity - represents a review decision on a data item.
/// </summary>
public class Review : BaseEntity
{
    /// <summary>
    /// Foreign key to the data item being reviewed.
    /// </summary>
    public int DataItemId { get; set; }

    /// <summary>
    /// Foreign key to the reviewer (User with Role = Reviewer).
    /// </summary>
    public int ReviewerId { get; set; }

    /// <summary>
    /// Review decision (Approved/Rejected).
    /// </summary>
    public ReviewDecision Decision { get; set; }

    /// <summary>
    /// Feedback from reviewer.
    /// REQUIRED if Decision = Rejected.
    /// </summary>
    public string? Feedback { get; set; }

    // ==================== Navigation Properties ====================

    /// <summary>
    /// Data item being reviewed.
    /// </summary>
    public virtual DataItem DataItem { get; set; } = null!;

    /// <summary>
    /// Reviewer who made this review.
    /// </summary>
    public virtual User Reviewer { get; set; } = null!;

    /// <summary>
    /// Error types associated with this review (if rejected).
    /// REQUIRED at least 1 if Decision = Rejected.
    /// </summary>
    public virtual ICollection<ReviewErrorType> ReviewErrorTypes { get; set; } = new List<ReviewErrorType>();
}
