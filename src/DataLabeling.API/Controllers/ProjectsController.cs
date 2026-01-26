using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Projects;
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

    public ProjectsController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    private int GetUserId()
    {
        // Try all possible claim types
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                 ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")
                 ?? User.FindFirst("sub")
                 ?? User.FindFirst("id")
                 ?? User.FindFirst("userId");

        if (claim != null && int.TryParse(claim.Value, out int userId))
        {
            Console.WriteLine($"✅ Found userId: {userId} from claim type: {claim.Type}");
            return userId;
        }

        // Debug: log all claims
        Console.WriteLine("❌ NO USER ID CLAIM FOUND!");
        Console.WriteLine($"Available claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"))}");

        return 0;
    }

    private UserRole GetUserRole()
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)
                     ?? User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")
                     ?? User.FindFirst("role");

        if (roleClaim != null && Enum.TryParse<UserRole>(roleClaim.Value, out var role))
        {
            Console.WriteLine($"✅ Found role: {role} from claim type: {roleClaim.Type}");
            return role;
        }

        Console.WriteLine("⚠️ No role claim found, defaulting to Annotator");
        return UserRole.Annotator;
    }

    /// <summary>
    /// Get paginated list of projects with filtering.
    /// Admin sees all projects, others see only their own.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ProjectDto>), 200)]
    public async Task<ActionResult<PagedResult<ProjectDto>>> GetProjects(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] ProjectStatus? status = null,
        [FromQuery] string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        // Admin can see all projects, others only their own
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
            UpdatedAt = p.UpdatedAt
        }).ToList();

        return Ok(new PagedResult<ProjectDto>
        {
            Items = result,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Get project by ID with full details.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ProjectDetailDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ProjectDetailDto>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var project = await _uow.Projects.GetWithDetailsAsync(id, cancellationToken);
        if (project == null) return NotFound();

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
            CreatedByName = project.CreatedBy.Name,
            HasDataset = project.Dataset != null,
            HasGuideline = project.Guideline != null,
            LabelCount = project.Labels.Count,
            TaskCount = project.Tasks.Count
        };

        return Ok(dto);
    }

    /// <summary>
    /// Get project statistics (item counts by status).
    /// </summary>
    [HttpGet("{id:int}/statistics")]
    [ProducesResponseType(typeof(ProjectStatistics), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ProjectStatistics>> GetStatistics(int id, CancellationToken cancellationToken = default)
    {
        var stats = await _uow.Projects.GetStatisticsAsync(id, cancellationToken);
        if (stats == null) return NotFound("Project or dataset not found");

        return Ok(stats);
    }

    /// <summary>
    /// Get projects with upcoming deadlines (within specified days).
    /// </summary>
    [HttpGet("upcoming-deadlines")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(IEnumerable<ProjectDto>), 200)]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetUpcomingDeadlines(
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
            UpdatedAt = p.UpdatedAt
        });

        return Ok(result);
    }

    /// <summary>
    /// Create a new project (Admin/Manager only).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ProjectDto), 201)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<ProjectDto>> Create(
        [FromBody] CreateProjectRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetUserId();

            if (userId == 0)
            {
                return Unauthorized(new { success = false, message = "User ID not found in token" });
            }

            Console.WriteLine($"🔹 Creating project '{request.Name}' by userId: {userId}");

            var project = new Project
            {
                Name = request.Name,
                Description = request.Description,
                Type = request.Type,
                Status = ProjectStatus.Draft,
                Deadline = request.Deadline,
                CreatedById = userId
            };

            await _uow.Projects.AddAsync(project, cancellationToken);
            await _uow.SaveChangesAsync(cancellationToken);

            Console.WriteLine($"✅ Project created successfully with Id: {project.Id}");

            var dto = new ProjectDto
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                Type = project.Type,
                Status = project.Status,
                Deadline = project.Deadline,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = project.Id }, dto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error creating project: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }

            return StatusCode(500, new
            {
                success = false,
                message = "An error occurred while creating the project",
                details = ex.Message
            });
        }
    }

    /// <summary>
    /// Update project information (Owner or Admin only).
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateProjectRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        var project = await _uow.Projects.GetByIdAsync(id, cancellationToken);
        if (project == null) return NotFound();

        if (project.CreatedById != userId && role != UserRole.Admin)
            return Forbid();

        project.Name = request.Name;
        project.Description = request.Description;
        project.Deadline = request.Deadline;

        _uow.Projects.Update(project);
        await _uow.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Change project status (Owner or Admin only).
    /// </summary>
    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ChangeStatus(
        int id,
        [FromBody] ChangeProjectStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        var project = await _uow.Projects.GetByIdAsync(id, cancellationToken);
        if (project == null) return NotFound();

        if (project.CreatedById != userId && role != UserRole.Admin)
            return Forbid();

        project.Status = request.Status;

        _uow.Projects.Update(project);
        await _uow.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Delete a project (Owner or Admin only).
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        var project = await _uow.Projects.GetByIdAsync(id, cancellationToken);
        if (project == null) return NotFound();

        if (project.CreatedById != userId && role != UserRole.Admin)
            return Forbid();

        _uow.Projects.Delete(project);
        await _uow.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Debug: Check current user claims and project access
    /// </summary>
    [HttpGet("debug/claims")]
    [ProducesResponseType(200)]
    public IActionResult DebugClaims()
    {
        var userId = GetUserId();
        var role = GetUserRole();

        return Ok(new
        {
            userId = userId,
            role = role.ToString(),
            allClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList()
        });
    }

    /// <summary>
    /// Debug: Check project access permission
    /// </summary>
    [HttpGet("{id:int}/debug-access")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DebugAccess(int id, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        var project = await _uow.Projects.GetByIdAsync(id, cancellationToken);
        if (project == null) return NotFound();

        return Ok(new
        {
            currentUserId = userId,
            currentUserRole = role.ToString(),
            projectId = project.Id,
            projectName = project.Name,
            projectCreatedById = project.CreatedById,
            canUpdate = project.CreatedById == userId || role == UserRole.Admin,
            checkResult = project.CreatedById == userId ? "✅ YOU ARE OWNER" :
                          role == UserRole.Admin ? "✅ YOU ARE ADMIN" :
                          "❌ NO PERMISSION"
        });
    }
}
