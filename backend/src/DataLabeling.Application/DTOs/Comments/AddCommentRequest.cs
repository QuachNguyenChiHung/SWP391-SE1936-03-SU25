namespace DataLabeling.Application.DTOs.Comments;

/// <summary>
/// Request model for adding a comment.
/// </summary>
public class AddCommentRequest
{
    /// <summary>
    /// The comment content.
    /// </summary>
    public string Content { get; set; } = default!;
}
