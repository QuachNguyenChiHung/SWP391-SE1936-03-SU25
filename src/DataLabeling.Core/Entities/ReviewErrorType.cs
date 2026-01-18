namespace DataLabeling.Core.Entities;

/// <summary>
/// ReviewErrorType entity - junction table linking Review to ErrorType.
/// Allows a review to have multiple error types.
/// </summary>
public class ReviewErrorType
{
    /// <summary>
    /// Primary key.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to the review.
    /// </summary>
    public int ReviewId { get; set; }

    /// <summary>
    /// Foreign key to the error type.
    /// </summary>
    public int ErrorTypeId { get; set; }

    // ==================== Navigation Properties ====================

    /// <summary>
    /// Review this error belongs to.
    /// </summary>
    public virtual Review Review { get; set; } = null!;

    /// <summary>
    /// Error type.
    /// </summary>
    public virtual ErrorType ErrorType { get; set; } = null!;
}
