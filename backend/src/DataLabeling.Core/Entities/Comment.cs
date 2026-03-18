using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Entities;

/// <summary>
/// Comment entity - represents feedback/comments on task items from reviewers.
/// </summary>
public class Comment : BaseEntity
{
    /// <summary>
    /// Foreign key to the task item.
    /// </summary>
    public int TaskItemId { get; set; }

    /// <summary>
    /// Foreign key to the author (User).
    /// </summary>
    public int AuthorId { get; set; }

    /// <summary>
    /// Role of the comment author (e.g., reviewer).
    /// </summary>
    public UserRole AuthorRole { get; set; }

    /// <summary>
    /// Content of the comment.
    /// </summary>
    public string Content { get; set; } = string.Empty;

    // ==================== Navigation Properties ====================

    /// <summary>
    /// Task item this comment belongs to.
    /// </summary>
    public virtual TaskItem TaskItem { get; set; } = null!;

    /// <summary>
    /// User who created this comment.
    /// </summary>
    public virtual User Author { get; set; } = null!;
}
