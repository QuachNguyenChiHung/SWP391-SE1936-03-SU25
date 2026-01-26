using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Tasks;
using DataLabeling.Core.Enums;
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

    public TasksController(IUnitOfWork uow)
    {
        _uow = uow;
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

        // Check if all items are completed
        if (task.CompletedItems < task.TotalItems)
        {
            return BadRequest(ApiResponse.FailureResponse(
                $"Cannot submit. Only {task.CompletedItems}/{task.TotalItems} items completed."));
        }

        // Update task status
        task.Status = AnnotationTaskStatus.Submitted;
        task.SubmittedAt = DateTime.UtcNow;

        _uow.AnnotationTasks.Update(task);
        await _uow.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse.SuccessResponse("Task submitted for review"));
    }
}
