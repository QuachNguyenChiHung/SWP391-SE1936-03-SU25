using DataLabeling.Application.DTOs.Annotations;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Exceptions;
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

    public AnnotationsController(IAnnotationService annotationService)
    {
        _annotationService = annotationService;
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

    // ==================== Annotation CRUD ====================

    /// <summary>
    /// Get all annotations for a data item.
    /// </summary>
    [HttpGet("data-items/{dataItemId:int}/annotations")]
    [ProducesResponseType(typeof(IEnumerable<AnnotationDto>), 200)]
    public async Task<ActionResult<IEnumerable<AnnotationDto>>> GetAnnotations(
        int dataItemId,
        CancellationToken cancellationToken = default)
    {
        var annotations = await _annotationService.GetByDataItemIdAsync(dataItemId, cancellationToken);
        return Ok(annotations);
    }

    /// <summary>
    /// Get a single annotation by ID.
    /// </summary>
    [HttpGet("annotations/{id:int}")]
    [ProducesResponseType(typeof(AnnotationDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<AnnotationDto>> GetAnnotation(
        int id,
        CancellationToken cancellationToken = default)
    {
        var annotation = await _annotationService.GetByIdAsync(id, cancellationToken);
        if (annotation == null)
            return NotFound(new { success = false, message = "Annotation not found" });

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
}
