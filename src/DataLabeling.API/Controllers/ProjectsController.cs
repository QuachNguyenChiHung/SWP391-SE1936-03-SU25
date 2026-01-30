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

    public ProjectsController(IUnitOfWork uow, IFileStorageService fileStorage)
    {
        _uow = uow;
        _fileStorage = fileStorage;
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
        var userId = GetUserId();

        if (userId == 0)
        {
            return Unauthorized(new { success = false, message = "User ID not found in token" });
        }

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

        // Create text guideline if content provided
        if (!string.IsNullOrWhiteSpace(request.GuidelineContent))
        {
            var guideline = new Guideline
            {
                ProjectId = project.Id,
                Content = request.GuidelineContent,
                Version = 1,
                UpdatedAt = DateTime.UtcNow
            };

            await _uow.Guidelines.AddAsync(guideline, cancellationToken);
            await _uow.SaveChangesAsync(cancellationToken);
        }

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

    // ==================== GUIDELINE ENDPOINTS ====================

    /// <summary>
    /// Upload guideline file for a project (PDF, DOCX, TXT, MD).
    /// Files are stored in private storage and require authentication to download.
    /// </summary>
    [HttpPost("{id:int}/guideline/upload")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UploadGuidelineFile(
        int id,
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { success = false, message = "No file uploaded" });

        // Validate file type
        var allowedExtensions = new[] { ".pdf", ".docx", ".doc", ".txt", ".md", ".html" };
        var extension = Path.GetExtension(file.FileName).ToLower();

        if (!allowedExtensions.Contains(extension))
            return BadRequest(new
            {
                success = false,
                message = $"File type not allowed. Allowed: {string.Join(", ", allowedExtensions)}"
            });

        // Validate file size (max 10MB)
        if (file.Length > 10 * 1024 * 1024)
            return BadRequest(new { success = false, message = "File size must be less than 10MB" });

        var userId = GetUserId();
        var role = GetUserRole();

        var project = await _uow.Projects.GetByIdAsync(id, cancellationToken);
        if (project == null)
            return NotFound(new { success = false, message = "Project not found" });

        // Check permission
        if (project.CreatedById != userId && role != UserRole.Admin)
            return Forbid();

        // Save file to PRIVATE storage (not publicly accessible)
        var (filePath, fileName, fileSize) = await _fileStorage.SavePrivateFileAsync(
            file,
            $"guidelines/{id}",
            cancellationToken);

        var existingGuideline = await _uow.Guidelines.GetByProjectIdAsync(id, cancellationToken);

        if (existingGuideline != null)
        {
            // Delete old file if exists (from private storage)
            if (!string.IsNullOrEmpty(existingGuideline.FilePath))
            {
                await _fileStorage.DeletePrivateFileAsync(existingGuideline.FilePath);
            }

            // Update guideline
            existingGuideline.FilePath = filePath;
            existingGuideline.FileName = fileName;
            existingGuideline.FileSize = fileSize;
            existingGuideline.ContentType = file.ContentType;
            existingGuideline.Content = null; // Clear text content
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
                FilePath = filePath,
                FileName = fileName,
                FileSize = fileSize,
                ContentType = file.ContentType,
                Version = 1
            };

            await _uow.Guidelines.AddAsync(guideline, cancellationToken);
        }

        await _uow.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            success = true,
            message = "Guideline file uploaded successfully",
            data = new
            {
                fileName = fileName,
                fileSize = fileSize,
                downloadUrl = $"/api/projects/{id}/guideline/download",
                version = existingGuideline?.Version + 1 ?? 1
            }
        });
    }

    /// <summary>
    /// Download guideline file.
    /// Requires authentication - files are served from private storage.
    /// </summary>
    [HttpGet("{id:int}/guideline/download")]
    [ProducesResponseType(typeof(FileResult), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DownloadGuideline(
        int id,
        CancellationToken cancellationToken = default)
    {
        var guideline = await _uow.Guidelines.GetByProjectIdAsync(id, cancellationToken);

        if (guideline == null)
            return NotFound(new { success = false, message = "Guideline not found" });

        if (string.IsNullOrEmpty(guideline.FilePath))
            return NotFound(new { success = false, message = "Guideline file not found" });

        // Check if file exists in private storage
        if (!_fileStorage.PrivateFileExists(guideline.FilePath))
            return NotFound(new { success = false, message = "File not found on server" });

        // Stream file from private storage
        var stream = _fileStorage.OpenPrivateFileRead(guideline.FilePath);

        return File(
            stream,
            guideline.ContentType ?? "application/octet-stream",
            guideline.FileName ?? "guideline");
    }

    /// <summary>
    /// Get guideline info (text or file metadata).
    /// Note: FileUrl is not provided for security - use download endpoint instead.
    /// </summary>
    [HttpGet("{id:int}/guideline")]
    [ProducesResponseType(typeof(GuidelineDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<GuidelineDto>> GetGuideline(
        int id,
        CancellationToken cancellationToken = default)
    {
        var guideline = await _uow.Guidelines.GetByProjectIdAsync(id, cancellationToken);

        if (guideline == null)
            return NotFound(new { success = false, message = "Guideline not found" });

        var dto = new GuidelineDto
        {
            Id = guideline.Id,
            ProjectId = guideline.ProjectId,
            Content = guideline.Content,
            FileName = guideline.FileName,
            FileSize = guideline.FileSize,
            ContentType = guideline.ContentType,
            // FileUrl is null for security - use /api/projects/{id}/guideline/download
            FileUrl = !string.IsNullOrEmpty(guideline.FilePath)
                ? $"/api/projects/{id}/guideline/download"
                : null,
            Version = guideline.Version,
            CreatedAt = guideline.CreatedAt,
            UpdatedAt = guideline.UpdatedAt
        };

        return Ok(dto);
    }
}
