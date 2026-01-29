using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Projects;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Interfaces;
using DataLabeling.Core.Interfaces.Repositories;
using DataLabeling.API.Services;
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
    /// <summary>
    /// Create a new project (Admin/Manager only).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ProjectDto), 201)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<ProjectDto>> Create(
        [FromBody] CreateProjectRequest request,  // ✅ Đổi lại thành [FromBody]
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

            // Create text guideline if content provided
            if (!string.IsNullOrWhiteSpace(request.GuidelineContent))
            {
                Console.WriteLine($"🔹 Creating guideline for project {project.Id}");

                var guideline = new Guideline
                {
                    ProjectId = project.Id,
                    Content = request.GuidelineContent,
                    Version = 1,
                    UpdatedAt = DateTime.UtcNow
                };

                await _uow.Guidelines.AddAsync(guideline, cancellationToken);
                await _uow.SaveChangesAsync(cancellationToken);

                Console.WriteLine($"✅ Guideline created with Id: {guideline.Id}");
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

    // ==================== GUIDELINE ENDPOINTS ====================

    /// <summary>
    /// Upload guideline file for a project (PDF, DOCX, TXT, MD)
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

        try
        {
            // Save file
            var (filePath, fileName, fileSize) = await _fileStorage.SaveFileAsync(
                file,
                $"guidelines/{id}",
                cancellationToken);

            var existingGuideline = await _uow.Guidelines.GetByProjectIdAsync(id, cancellationToken);

            if (existingGuideline != null)
            {
                // Delete old file if exists
                if (!string.IsNullOrEmpty(existingGuideline.FilePath))
                {
                    await _fileStorage.DeleteFileAsync(existingGuideline.FilePath);
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
                    Version = 1,
                    UpdatedAt = DateTime.UtcNow
                };

                await _uow.Guidelines.AddAsync(guideline, cancellationToken);
            }

            await _uow.SaveChangesAsync(cancellationToken);

            Console.WriteLine($"✅ Guideline file uploaded: {fileName} ({fileSize} bytes)");

            return Ok(new
            {
                success = true,
                message = "Guideline file uploaded successfully",
                data = new
                {
                    fileName = fileName,
                    fileSize = fileSize,
                    fileUrl = _fileStorage.GetFileUrl(filePath),
                    version = existingGuideline?.Version + 1 ?? 1
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error uploading guideline file: {ex.Message}");
            return StatusCode(500, new
            {
                success = false,
                message = "Failed to upload file",
                details = ex.Message
            });
        }
    }

    /// <summary>
    /// Download guideline file
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

        var filePath = Path.Combine(
            Directory.GetCurrentDirectory(),
            "uploads",
            guideline.FilePath.Replace("/", Path.DirectorySeparatorChar.ToString()));

        if (!System.IO.File.Exists(filePath))
            return NotFound(new { success = false, message = "File not found on server" });

        var memory = new MemoryStream();
        using (var stream = new FileStream(filePath, FileMode.Open))
        {
            await stream.CopyToAsync(memory, cancellationToken);
        }
        memory.Position = 0;

        return File(
            memory,
            guideline.ContentType ?? "application/octet-stream",
            guideline.FileName ?? "guideline");
    }

    /// <summary>
    /// Get guideline info (text or file metadata)
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
            FileUrl = !string.IsNullOrEmpty(guideline.FilePath)
                ? _fileStorage.GetFileUrl(guideline.FilePath)
                : null,
            Version = guideline.Version,
            CreatedAt = guideline.CreatedAt,
            UpdatedAt = guideline.UpdatedAt ?? guideline.CreatedAt
        };

        return Ok(dto);
    }

    // ==================== DEBUG ENDPOINTS ====================

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