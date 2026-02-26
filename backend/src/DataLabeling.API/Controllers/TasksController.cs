using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Tasks;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DataLabeling.API.Controllers;

/// <summary>
/// Controller for managing annotation tasks.
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly ITaskService _taskService;

    public TasksController(IUnitOfWork uow, ITaskService taskService)
    {
        _uow = uow;
        _taskService = taskService;
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                 ?? User.FindFirst("sub")
                 ?? User.FindFirst("id")
                 ?? User.FindFirst("userId");

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
    /// Get paginated list of tasks.
    /// Manager sees tasks in their projects, Annotator sees assigned tasks.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Manager,Annotator")]
    [ProducesResponseType(typeof(PagedResult<TaskDto>), 200)]
    public async Task<ActionResult<PagedResult<TaskDto>>> GetTasks(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] int? projectId = null,
        [FromQuery] AnnotationTaskStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        int? annotatorFilter = null;

        // Annotator can only see their own tasks
        if (role == UserRole.Annotator)
        {
            annotatorFilter = userId;
        }

        // Manager can optionally filter by project (only their projects)
        // Admin sees all
        var (items, totalCount) = await _uow.AnnotationTasks.GetPagedAsync(
            pageNumber, pageSize, projectId, annotatorFilter, status, cancellationToken);

        var result = items.Select(t => new TaskDto
        {
            Id = t.Id,
            ProjectId = t.ProjectId,
            ProjectName = t.Project?.Name ?? "Unknown",
            AnnotatorId = t.AnnotatorId,
            AnnotatorName = t.Annotator?.Name ?? "Unknown",
            Status = t.Status,
            TotalItems = t.TotalItems,
            CompletedItems = t.CompletedItems,
            ProgressPercent = t.ProgressPercent,
            AssignedAt = t.AssignedAt,
            SubmittedAt = t.SubmittedAt,
            CompletedAt = t.CompletedAt,
            CreatedAt = t.CreatedAt
        }).ToList();

        return Ok(new PagedResult<TaskDto>
        {
            Items = result,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Get task detail with all items.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(TaskDetailDto), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<TaskDetailDto>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        var task = await _uow.AnnotationTasks.GetWithDetailsAsync(id, cancellationToken);
        if (task == null) return NotFound();

        // Annotator can only view their own tasks
        if (role == UserRole.Annotator && task.AnnotatorId != userId)
        {
            return Forbid();
        }

        var dto = new TaskDetailDto
        {
            Id = task.Id,
            ProjectId = task.ProjectId,
            ProjectName = task.Project?.Name ?? "Unknown",
            AnnotatorId = task.AnnotatorId,
            AnnotatorName = task.Annotator?.Name ?? "Unknown",
            AssignedById = task.AssignedById,
            AssignedByName = task.AssignedBy?.Name ?? "Unknown",
            Status = task.Status,
            TotalItems = task.TotalItems,
            CompletedItems = task.CompletedItems,
            ProgressPercent = task.ProgressPercent,
            AssignedAt = task.AssignedAt,
            SubmittedAt = task.SubmittedAt,
            CompletedAt = task.CompletedAt,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt,
            Items = task.TaskItems.Select(ti => new TaskItemDto
            {
                Id = ti.Id,
                DataItemId = ti.DataItemId,
                FileName = ti.DataItem?.FileName ?? "Unknown",
                FilePath = ti.DataItem?.FilePath ?? "",
                ThumbnailPath = ti.DataItem?.ThumbnailPath,
                Status = ti.Status,
                DataItemStatus = ti.DataItem?.Status ?? DataItemStatus.Pending,
                AssignedAt = ti.AssignedAt,
                StartedAt = ti.StartedAt,
                CompletedAt = ti.CompletedAt
            }).ToList()
        };

        return Ok(dto);
    }

    /// <summary>
    /// Submit a task for review (Annotator only).
    /// </summary>
    [HttpPost("{id:int}/submit")]
    [Authorize(Roles = "Annotator")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ApiResponse>> SubmitTask(int id, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();

        var task = await _uow.AnnotationTasks.GetWithTaskItemsAsync(id, cancellationToken);
        if (task == null) return NotFound();

        // Only the assigned annotator can submit
        if (task.AnnotatorId != userId)
        {
            return Forbid();
        }

        // Check if task can be submitted
        if (task.Status == AnnotationTaskStatus.Submitted)
        {
            return BadRequest(ApiResponse.FailureResponse("Task is already submitted"));
        }

        if (task.Status == AnnotationTaskStatus.Completed)
        {
            return BadRequest(ApiResponse.FailureResponse("Task is already completed"));
        }

        // Check if all items are completed (verify actual TaskItem statuses)
        var incompleteItems = task.TaskItems.Count(ti => ti.Status != TaskItemStatus.Completed);
        if (incompleteItems > 0)
        {
            return BadRequest(ApiResponse.FailureResponse(
                $"Cannot submit. {incompleteItems} item(s) not yet completed."));
        }

        // Update task status
        task.Status = AnnotationTaskStatus.Submitted;
        task.SubmittedAt = DateTime.UtcNow;

        _uow.AnnotationTasks.Update(task);
        await _uow.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse.SuccessResponse("Task submitted for review"));
    }

    /// <summary>
    /// Create a new task and assign to an annotator (Admin/Manager only).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(TaskAssignmentResultDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<TaskAssignmentResultDto>> CreateTask(
        [FromBody] CreateTaskRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token" });

        try
        {
            var result = await _taskService.CreateTaskAsync(request, userId, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.Task.Id }, result);
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
    /// Assign additional items to an existing task (Admin/Manager only).
    /// </summary>
    [HttpPost("{id:int}/items")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(TaskAssignmentResultDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<TaskAssignmentResultDto>> AssignItems(
        int id,
        [FromBody] AssignItemsRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _taskService.AssignItemsAsync(id, request, cancellationToken);
            return Ok(result);
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
    /// Remove items from a task (Admin/Manager only).
    /// Only items that haven't been started can be removed.
    /// </summary>
    [HttpDelete("{id:int}/items")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RemoveItems(
        int id,
        [FromBody] int[] dataItemIds,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var removedCount = await _taskService.RemoveItemsAsync(id, dataItemIds, cancellationToken);
            return Ok(new { success = true, message = $"{removedCount} item(s) removed from task" });
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
    /// Delete a task (Admin/Manager only).
    /// Only tasks that haven't been worked on can be deleted.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteTask(int id, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token" });

        try
        {
            await _taskService.DeleteTaskAsync(id, userId, cancellationToken);
            return NoContent();
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
    /// Get unassigned items for a project (items available for task assignment).
    /// </summary>
    [HttpGet("projects/{projectId:int}/unassigned-items")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(PagedResult<UnassignedItemDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<PagedResult<UnassignedItemDto>>> GetUnassignedItems(
        int projectId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _taskService.GetUnassignedItemsAsync(projectId, pageNumber, pageSize, cancellationToken);
            return Ok(result);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Get available annotators for task assignment.
    /// Returns annotators sorted by active task count (least busy first).
    /// </summary>
    [HttpGet("annotators")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(IEnumerable<AnnotatorDto>), 200)]
    public async Task<ActionResult<IEnumerable<AnnotatorDto>>> GetAvailableAnnotators(
        CancellationToken cancellationToken = default)
    {
        var annotators = await _taskService.GetAvailableAnnotatorsAsync(cancellationToken);
        return Ok(annotators);
    }
}
