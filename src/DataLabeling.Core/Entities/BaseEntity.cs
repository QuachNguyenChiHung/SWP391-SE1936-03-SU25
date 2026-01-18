namespace DataLabeling.Core.Entities;

/// <summary>
/// Base entity class that all entities inherit from.
/// Provides common properties: Id, CreatedAt, UpdatedAt.
/// </summary>
public abstract class BaseEntity
{
    /// <summary>
    /// Primary key - auto-incremented.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Timestamp when the entity was created. Defaults to UTC now.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp when the entity was last updated. Null if never updated.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
