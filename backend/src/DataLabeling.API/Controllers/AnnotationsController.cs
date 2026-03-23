using DataLabeling.Application.DTOs.Annotations;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DataLabeling.API.Controllers;

/// <summary>
/// Controller for annotation operations.
/// </summary>
[Route("api")]
[ApiController]
[Authorize]
public class AnnotationsController : ControllerBase
{
    private readonly IAnnotationService _annotationService;
    private readonly IUnitOfWork _uow;

    public AnnotationsController(IAnnotationService annotationService, IUnitOfWork uow)
    {
        _annotationService = annotationService;
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

    // ==================== Annotation CRUD ====================

    /// <summary>
    /// Get all annotations for a data item.
    /// </summary>
    [HttpGet("data-items/{dataItemId:int}/annotations")]
    [ProducesResponseType(typeof(IEnumerable<AnnotationDto>), 200)]
    [ProducesResponseType(403)]
    public async Task<ActionResult<IEnumerable<AnnotationDto>>> GetAnnotations(
        int dataItemId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        if (role == UserRole.Annotator)
        {
            var isAssigned = await _uow.DataItems.IsAssignedToAnnotatorAsync(dataItemId, userId, cancellationToken);
            if (!isAssigned)
                return Forbid();
        }

        var annotations = await _annotationService.GetByDataItemIdAsync(dataItemId, cancellationToken);
        return Ok(annotations);
    }

    /// <summary>
    /// Get a single annotation by ID.
    /// </summary>
    [HttpGet("annotations/{id:int}")]
    [ProducesResponseType(typeof(AnnotationDto), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<AnnotationDto>> GetAnnotation(
        int id,
        CancellationToken cancellationToken = default)
    {
        var annotation = await _annotationService.GetByIdAsync(id, cancellationToken);
        if (annotation == null)
            return NotFound(new { success = false, message = "Annotation not found" });

        var userId = GetUserId();
        var role = GetUserRole();

        if (role == UserRole.Annotator)
        {
            var isAssigned = await _uow.DataItems.IsAssignedToAnnotatorAsync(annotation.DataItemId, userId, cancellationToken);
            if (!isAssigned)
                return Forbid();
        }

        return Ok(annotation);
    }

    /// <summary>
    /// Create a new annotation on a data item.
    /// </summary>
    [HttpPost("data-items/{dataItemId:int}/annotations")]
    [Authorize(Roles = "Admin,Manager,Annotator")]
    [ProducesResponseType(typeof(AnnotationDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<AnnotationDto>> CreateAnnotation(
        int dataItemId,
        [FromBody] CreateAnnotationRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token" });

        try
        {
            var annotation = await _annotationService.CreateAsync(dataItemId, request, userId, cancellationToken);
            return CreatedAtAction(nameof(GetAnnotation), new { id = annotation.Id }, annotation);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing annotation.
    /// </summary>
    [HttpPut("annotations/{id:int}")]
    [Authorize(Roles = "Admin,Manager,Annotator")]
    [ProducesResponseType(typeof(AnnotationDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<AnnotationDto>> UpdateAnnotation(
        int id,
        [FromBody] UpdateAnnotationRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token" });

        try
        {
            var annotation = await _annotationService.UpdateAsync(id, request, userId, cancellationToken);
            return Ok(annotation);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Delete an annotation.
    /// </summary>
    [HttpDelete("annotations/{id:int}")]
    [Authorize(Roles = "Admin,Manager,Annotator")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteAnnotation(
        int id,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token" });

        try
        {
            await _annotationService.DeleteAsync(id, userId, cancellationToken);
            return NoContent();
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Save all annotations for a data item (batch operation).
    /// Replaces all existing annotations with the new set.
    /// </summary>
    [HttpPost("data-items/{dataItemId:int}/annotations/save-all")]
    [Authorize(Roles = "Admin,Manager,Annotator")]
    [ProducesResponseType(typeof(IEnumerable<AnnotationDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<IEnumerable<AnnotationDto>>> SaveAllAnnotations(
        int dataItemId,
        [FromBody] SaveAnnotationsRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token" });

        try
        {
            var annotations = await _annotationService.SaveAllAsync(dataItemId, request, userId, cancellationToken);
            return Ok(annotations);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    // ==================== Task Item Status Management ====================

    /// <summary>
    /// Get annotation editor data for a task item.
    /// Returns image info, labels, existing annotations, and navigation.
    /// </summary>
    [HttpGet("task-items/{taskItemId:int}/editor")]
    [Authorize(Roles = "Admin,Manager,Annotator")]
    [ProducesResponseType(typeof(AnnotationEditorDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<AnnotationEditorDto>> GetEditorData(
        int taskItemId,
        CancellationToken cancellationToken = default)
    {
        var data = await _annotationService.GetAnnotationEditorDataAsync(taskItemId, cancellationToken);
        if (data == null)
            return NotFound(new { success = false, message = "Task item not found" });

        return Ok(data);
    }

    /// <summary>
    /// Start working on a task item (marks as InProgress).
    /// </summary>
    [HttpPost("task-items/{taskItemId:int}/start")]
    [Authorize(Roles = "Annotator")]
    [ProducesResponseType(typeof(TaskItemProgressDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<TaskItemProgressDto>> StartWorking(
        int taskItemId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token" });

        try
        {
            var result = await _annotationService.StartWorkingAsync(taskItemId, userId, cancellationToken);
            return Ok(result);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Complete a task item (marks as Completed).
    /// </summary>
    [HttpPost("task-items/{taskItemId:int}/complete")]
    [Authorize(Roles = "Annotator")]
    [ProducesResponseType(typeof(TaskItemProgressDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<TaskItemProgressDto>> CompleteItem(
        int taskItemId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token" });

        try
        {
            var result = await _annotationService.CompleteItemAsync(taskItemId, userId, cancellationToken);
            return Ok(result);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    // ==================== Re-annotation ====================

    /// <summary>
    /// Start re-annotation on a rejected task item.
    /// Resets the item status so annotator can fix and re-submit.
    /// </summary>
    [HttpPost("task-items/{taskItemId:int}/re-annotate")]
    [Authorize(Roles = "Annotator")]
    [ProducesResponseType(typeof(TaskItemProgressDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<TaskItemProgressDto>> StartReAnnotation(
        int taskItemId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token" });

        try
        {
            var result = await _annotationService.StartReAnnotationAsync(taskItemId, userId, cancellationToken);
            return Ok(result);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Get rejected items for a task that need re-annotation.
    /// </summary>
    [HttpGet("tasks/{taskId:int}/rejected-items")]
    [Authorize(Roles = "Annotator")]
    [ProducesResponseType(typeof(IEnumerable<RejectedItemDto>), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<IEnumerable<RejectedItemDto>>> GetRejectedItems(
        int taskId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token" });

        try
        {
            var items = await _annotationService.GetRejectedItemsAsync(taskId, userId, cancellationToken);
            return Ok(items);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
        }
    }

    // ==================== Flag Items ====================

    /// <summary>
    /// Flag a task item as having no suitable label or other issues (Annotator only).
    /// Changes status to Flagged and optionally records a reason as a comment.
    /// </summary>
    [HttpPost("task-items/{taskItemId:int}/flag")]
    [Authorize(Roles = "Annotator")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> FlagTaskItem(
        int taskItemId,
        [FromBody] FlagTaskItemRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token" });

        var taskItem = await _uow.TaskItems.GetByIdAsync(taskItemId, cancellationToken);
        if (taskItem == null)
            return NotFound(new { success = false, message = "Task item not found" });

        // Load the task to check ownership
        var task = await _uow.AnnotationTasks.GetByIdAsync(taskItem.TaskId, cancellationToken);
        if (task == null)
            return NotFound(new { success = false, message = "Task not found" });

        // Only the assigned annotator can flag the item
        if (task.AnnotatorId != userId)
        {
            return StatusCode(403, new { success = false, message = "You can only flag items in your own tasks" });
        }

        // Cannot flag if already completed
        if (taskItem.Status == TaskItemStatus.Completed)
        {
            return BadRequest(new { success = false, message = "Cannot flag completed item" });
        }

        // Cannot flag if task is submitted or completed
        if (task.Status == AnnotationTaskStatus.Submitted || task.Status == AnnotationTaskStatus.Completed)
        {
            return BadRequest(new { success = false, message = "Cannot flag item in submitted/completed task" });
        }

        // Update TaskItem status to Flagged
        taskItem.Status = TaskItemStatus.Flagged;
        taskItem.UpdatedAt = DateTime.UtcNow;
        _uow.TaskItems.Update(taskItem);

        // Update DataItem status to Reported
        var dataItem = await _uow.DataItems.GetByIdAsync(taskItem.DataItemId, cancellationToken);
        if (dataItem != null)
        {
            dataItem.Status = DataItemStatus.Reported;
            dataItem.UpdatedAt = DateTime.UtcNow;
            _uow.DataItems.Update(dataItem);
        }

        // Optionally create a comment with the reason
        if (!string.IsNullOrWhiteSpace(request?.Reason))
        {
            var comment = new Core.Entities.Comment
            {
                TaskItemId = taskItemId,
                AuthorId = userId,
                AuthorRole = UserRole.Annotator,
                Content = $"[FLAGGED] {request.Reason}",
                CreatedAt = DateTime.UtcNow
            };
            await _uow.Comments.AddAsync(comment, cancellationToken);
        }

        await _uow.SaveChangesAsync(cancellationToken);

        return Ok(new { success = true, message = "Task item flagged successfully" });
    }

    /// <summary>
    /// Unflag a task item (Admin/Manager only).
    /// Changes status from Flagged back to Assigned and resets DataItem status.
    /// </summary>
    [HttpPost("task-items/{taskItemId:int}/unflag")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UnflagTaskItem(
        int taskItemId,
        CancellationToken cancellationToken = default)
    {
        var taskItem = await _uow.TaskItems.GetByIdAsync(taskItemId, cancellationToken);
        if (taskItem == null)
            return NotFound(new { success = false, message = "Task item not found" });

        // Update TaskItem status back to Assigned
        if (taskItem.Status == TaskItemStatus.Flagged)
        {
            taskItem.Status = TaskItemStatus.Assigned;
            taskItem.UpdatedAt = DateTime.UtcNow;
            _uow.TaskItems.Update(taskItem);

            // Reset DataItem status back to Assigned
            var dataItem = await _uow.DataItems.GetByIdAsync(taskItem.DataItemId, cancellationToken);
            if (dataItem != null && dataItem.Status == DataItemStatus.Reported)
            {
                dataItem.Status = DataItemStatus.Assigned;
                dataItem.UpdatedAt = DateTime.UtcNow;
                _uow.DataItems.Update(dataItem);
            }

            await _uow.SaveChangesAsync(cancellationToken);
        }

        return Ok(new { success = true, message = "Task item unflagged successfully" });
    }
}

// Request DTOs
public class FlagTaskItemRequest
{
    public string? Reason { get; set; }
}
