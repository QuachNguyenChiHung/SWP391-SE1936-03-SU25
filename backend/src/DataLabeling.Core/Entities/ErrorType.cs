namespace DataLabeling.Core.Entities;

/// <summary>
/// ErrorType entity - lookup table for error types used in reviews.
/// Pre-populated with E01-E05.
/// Does NOT inherit from BaseEntity (no CreatedAt/UpdatedAt).
/// </summary>
public class ErrorType
{
    /// <summary>
    /// Primary key.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Error code (E01, E02, etc.).
    /// </summary>
    public required string Code { get; set; }

    /// <summary>
    /// Error name.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Detailed description of this error type.
    /// </summary>
    public string? Description { get; set; }

    // ==================== Navigation Properties ====================

    /// <summary>
    /// Reviews that have this error type.
    /// </summary>
    public virtual ICollection<ReviewErrorType> ReviewErrorTypes { get; set; } = new List<ReviewErrorType>();
}
