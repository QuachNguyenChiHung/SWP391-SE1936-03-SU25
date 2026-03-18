using DataLabeling.Application.DTOs.Comments;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DataLabeling.API.Controllers;

/// <summary>
/// Controller for comment operations on task items.
/// </summary>
[Route("api")]
[ApiController]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;
    private readonly IUnitOfWork _uow;

    public CommentsController(ICommentService commentService, IUnitOfWork uow)
    {
        _commentService = commentService;
        _uow = uow;
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                 ?? User.FindFirst("sub");

        if (claim != null && int.TryParse(claim.Value, out int userId))
        {
            return userId;
        }

        return 0;
    }

    private UserRole GetUserRole()
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)
                     ?? User.FindFirst("role");

        if (roleClaim != null && Enum.TryParse<UserRole>(roleClaim.Value, out var role))
        {
            return role;
        }

        return UserRole.Annotator;
    }

    /// <summary>
    /// Get all comments for a task item, sorted by creation date (newest first).
    /// Annotators can only view comments on their assigned task items.
    /// </summary>
    [HttpGet("task-items/{taskItemId:int}/comments")]
    [ProducesResponseType(typeof(IEnumerable<CommentDto>), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<IEnumerable<CommentDto>>> GetCommentsByTaskItem(
        int taskItemId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        // Get task item
        var taskItem = await _uow.TaskItems.GetByIdAsync(taskItemId, cancellationToken);
        if (taskItem == null)
            return NotFound(new { message = "Task item not found" });

        // For annotators, verify they own this task item
        if (role == UserRole.Annotator)
        {
            var task = await _uow.AnnotationTasks.GetByIdAsync(taskItem.TaskId, cancellationToken);
            if (task == null || task.AnnotatorId != userId)
                return Forbid();
        }

        var comments = await _commentService.GetCommentsByTaskItemIdAsync(taskItemId, cancellationToken);
        return Ok(comments);
    }

    /// <summary>
    /// Add a new comment to a task item.
    /// Only reviewers can add comments on rejected task items.
    /// </summary>
    [HttpPost("task-items/{taskItemId:int}/comments")]
    [ProducesResponseType(typeof(CommentDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<CommentDto>> AddComment(
        int taskItemId,
        [FromBody] AddCommentRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        // Only reviewers and admins can add comments
        if (role != UserRole.Reviewer && role != UserRole.Admin)
            return Forbid();

        // Validate request
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new { message = "Comment content cannot be empty" });

        try
        {
            var comment = await _commentService.AddCommentAsync(taskItemId, userId, request.Content, cancellationToken);
            return CreatedAtAction(nameof(GetCommentsByTaskItem), new { taskItemId }, comment);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

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
