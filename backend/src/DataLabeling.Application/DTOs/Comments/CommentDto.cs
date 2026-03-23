using DataLabeling.Core.Enums;

namespace DataLabeling.Application.DTOs.Comments;

/// <summary>
/// Comment DTO - represents a comment on a task item.
/// </summary>
public class CommentDto
{
    public int Id { get; set; }
    public int TaskItemId { get; set; }
    public int AuthorId { get; set; }
    public string? AuthorName { get; set; }
    public UserRole AuthorRole { get; set; }
    public string Content { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
}
