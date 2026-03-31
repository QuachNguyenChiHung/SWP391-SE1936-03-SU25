using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Projects;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Interfaces;
using DataLabeling.Core.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DataLabeling.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly IFileStorageService _fileStorage;
    private readonly IProjectService _projectService;

    public ProjectsController(IUnitOfWork uow, IFileStorageService fileStorage, IProjectService projectService)
    {
        _uow = uow;
        _fileStorage = fileStorage;
        _projectService = projectService;
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
    /// Get paginated list of projects with filtering.
    /// Admin sees all projects, others see only their own.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ProjectDto>>), 200)]
    public async Task<ActionResult<ApiResponse<PagedResult<ProjectDto>>>> GetProjects(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] ProjectStatus? status = null,
        [FromQuery] string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        // Reviewer sees projects they've reviewed or have items pending review
        if (role == UserRole.Reviewer)
        {
            var (reviewerItems, reviewerTotalCount) = await _uow.Projects.GetPagedByReviewerAsync(
                userId, pageNumber, pageSize, status, searchTerm, cancellationToken);

            var reviewerResult = reviewerItems.Select(p => new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Type = p.Type,
                Status = p.Status,
                Deadline = p.Deadline,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                TotalItems = p.Dataset?.DataItems?.Count ?? 0,
                FinishedItems = p.Dataset?.DataItems?.Count(d => d.Status == DataItemStatus.Approved) ?? 0
            }).ToList();

            var reviewerPagedResult = new PagedResult<ProjectDto>
            {
                Items = reviewerResult,
                TotalCount = reviewerTotalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            return Ok(ApiResponse<PagedResult<ProjectDto>>.SuccessResponse(reviewerPagedResult));
        }

        // Annotator sees only projects where they have assigned tasks
        if (role == UserRole.Annotator)
        {
            var (annotatorItems, annotatorTotalCount) = await _uow.Projects.GetPagedByAnnotatorAsync(
                userId, pageNumber, pageSize, status, searchTerm, cancellationToken);

            var annotatorResult = annotatorItems.Select(p => new ProjectDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Type = p.Type,
                Status = p.Status,
                Deadline = p.Deadline,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                TotalItems = p.Dataset?.DataItems?.Count ?? 0,
                FinishedItems = p.Dataset?.DataItems?.Count(d => d.Status == DataItemStatus.Approved) ?? 0
            }).ToList();

            var annotatorPagedResult = new PagedResult<ProjectDto>
            {
                Items = annotatorResult,
                TotalCount = annotatorTotalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            return Ok(ApiResponse<PagedResult<ProjectDto>>.SuccessResponse(annotatorPagedResult));
        }

        // Admin can see all projects, Manager sees only their own
        int? creatorFilter = role == UserRole.Admin ? null : userId;

        var (items, totalCount) = await _uow.Projects.GetPagedAsync(
            pageNumber, pageSize, status, creatorFilter, searchTerm, cancellationToken);

        var result = items.Select(p => new ProjectDto
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            Type = p.Type,
            Status = p.Status,
            Deadline = p.Deadline,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
            TotalItems = p.Dataset?.DataItems?.Count ?? 0,
            FinishedItems = p.Dataset?.DataItems?.Count(d => d.Status == DataItemStatus.Approved) ?? 0
        }).ToList();

        var pagedResult = new PagedResult<ProjectDto>
        {
            Items = result,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return Ok(ApiResponse<PagedResult<ProjectDto>>.SuccessResponse(pagedResult));
    }

    /// <summary>
    /// Get project by ID with full details.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ProjectDetailDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ApiResponse<ProjectDetailDto>>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var project = await _uow.Projects.GetWithDetailsAsync(id, cancellationToken);
        if (project == null) return NotFound(ApiResponse.FailureResponse("Project not found"));

        var dto = new ProjectDetailDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Type = project.Type,
            Status = project.Status,
            Deadline = project.Deadline,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            CreatedById = project.CreatedById,
            CreatedByName = project.CreatedBy?.Name ?? "Unknown",
            HasDataset = project.Dataset != null,
            HasGuideline = project.Guideline != null,
            LabelCount = project.Labels.Count,
            TaskCount = project.Tasks.Count,
            TotalItems = project.Dataset?.DataItems?.Count ?? 0,
            FinishedItems = project.Dataset?.DataItems?.Count(d => d.Status == DataItemStatus.Approved) ?? 0
        };

        return Ok(ApiResponse<ProjectDetailDto>.SuccessResponse(dto));
    }

    /// <summary>
    /// Get project statistics (item counts by status).
    /// </summary>
    [HttpGet("{id:int}/statistics")]
    [ProducesResponseType(typeof(ApiResponse<ProjectStatistics>), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ApiResponse<ProjectStatistics>>> GetStatistics(int id, CancellationToken cancellationToken = default)
    {
        var stats = await _uow.Projects.GetStatisticsAsync(id, cancellationToken);
        if (stats == null) return NotFound(ApiResponse.FailureResponse("Project or dataset not found"));

        return Ok(ApiResponse<ProjectStatistics>.SuccessResponse(stats));
    }

    /// <summary>
    /// Get projects with upcoming deadlines (within specified days).
    /// </summary>
    [HttpGet("upcoming-deadlines")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ProjectDto>>), 200)]
    public async Task<ActionResult<ApiResponse<IEnumerable<ProjectDto>>>> GetUpcomingDeadlines(
        [FromQuery] int daysAhead = 7,
        CancellationToken cancellationToken = default)
    {
        var projects = await _uow.Projects.GetWithUpcomingDeadlineAsync(daysAhead, cancellationToken);

        var result = projects.Select(p => new ProjectDto
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            Type = p.Type,
            Status = p.Status,
            Deadline = p.Deadline,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
            TotalItems = p.Dataset?.DataItems?.Count ?? 0,
            FinishedItems = p.Dataset?.DataItems?.Count(d => d.Status == DataItemStatus.Approved) ?? 0
        });

        return Ok(ApiResponse<IEnumerable<ProjectDto>>.SuccessResponse(result));
    }

    /// <summary>
    /// Create a new project (Admin/Manager only).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse<ProjectDto>), 201)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<ApiResponse<ProjectDto>>> Create(
        [FromBody] CreateProjectRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();

        if (userId == 0)
        {
            return Unauthorized(ApiResponse.FailureResponse("User ID not found in token"));
        }

        var dto = await _projectService.CreateAsync(request, userId, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = dto.Id },
            ApiResponse<ProjectDto>.SuccessResponse(dto, "Project created successfully."));
    }

    /// <summary>
    /// Update project information (Owner or Admin only).
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateProjectRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        try
        {
            await _projectService.UpdateAsync(id, request, userId, role, cancellationToken);
            return Ok(ApiResponse.SuccessResponse("Project updated successfully."));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse.FailureResponse("Project not found"));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Change project status (Owner or Admin only).
    /// </summary>
    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ChangeStatus(
        int id,
        [FromBody] ChangeProjectStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        try
        {
            await _projectService.ChangeStatusAsync(id, request.Status, userId, role, cancellationToken);
            return Ok(ApiResponse.SuccessResponse("Project status updated successfully."));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse.FailureResponse("Project not found"));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Delete a project (Owner or Admin only).
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse), 200)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        try
        {
            await _projectService.DeleteAsync(id, userId, role, cancellationToken);
            return Ok(ApiResponse.SuccessResponse("Project deleted successfully."));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse.FailureResponse("Project not found"));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    // ==================== GUIDELINE ENDPOINTS ====================

    /// <summary>
    /// Get guideline for a project.
    /// </summary>
    [HttpGet("{id:int}/guideline")]
    [ProducesResponseType(typeof(ApiResponse<GuidelineDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ApiResponse<GuidelineDto>>> GetGuideline(
        int id,
        CancellationToken cancellationToken = default)
    {
        var guideline = await _uow.Guidelines.GetByProjectIdAsync(id, cancellationToken);

        if (guideline == null)
            return NotFound(ApiResponse.FailureResponse("Guideline not found"));

        var dto = new GuidelineDto
        {
            Id = guideline.Id,
            ProjectId = guideline.ProjectId,
            Content = guideline.Content,
            Version = guideline.Version,
            CreatedAt = guideline.CreatedAt,
            UpdatedAt = guideline.UpdatedAt
        };

        return Ok(ApiResponse<GuidelineDto>.SuccessResponse(dto));
    }

    /// <summary>
    /// Create or update guideline for a project.
    /// </summary>
    [HttpPost("{id:int}/guideline")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse<GuidelineDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ApiResponse<GuidelineDto>>> SaveGuideline(
        int id,
        [FromBody] List<string> content,
        CancellationToken cancellationToken = default)
    {
        if (content == null || content.Count == 0)
            return BadRequest(ApiResponse.FailureResponse("Content cannot be empty"));

        var userId = GetUserId();
        var role = GetUserRole();

        var project = await _uow.Projects.GetByIdAsync(id, cancellationToken);
        if (project == null)
            return NotFound(ApiResponse.FailureResponse("Project not found"));

        // Check permission
        if (project.CreatedById != userId && role != UserRole.Admin)
            return Forbid();

        var existingGuideline = await _uow.Guidelines.GetByProjectIdAsync(id, cancellationToken);

        if (existingGuideline != null)
        {
            // Update guideline
            existingGuideline.Content = content;
            existingGuideline.Version++;
            existingGuideline.UpdatedAt = DateTime.UtcNow;

            _uow.Guidelines.Update(existingGuideline);
        }
        else
        {
            // Create new guideline
            var guideline = new Guideline
            {
                ProjectId = id,
                Content = content,
                Version = 1
            };

            await _uow.Guidelines.AddAsync(guideline, cancellationToken);
        }

        await _uow.SaveChangesAsync(cancellationToken);

        var updated = await _uow.Guidelines.GetByProjectIdAsync(id, cancellationToken);
        var dto = new GuidelineDto
        {
            Id = updated!.Id,
            ProjectId = updated.ProjectId,
            Content = updated.Content,
            Version = updated.Version,
            CreatedAt = updated.CreatedAt,
            UpdatedAt = updated.UpdatedAt
        };

        return Ok(ApiResponse<GuidelineDto>.SuccessResponse(dto, "Guideline saved successfully"));
    }
}
