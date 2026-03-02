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
            UpdatedAt = project.UpdatedAt,
            TotalItems = 0,
            FinishedItems = 0
        };

        return CreatedAtAction(nameof(GetById), new { id = project.Id },
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

        var project = await _uow.Projects.GetByIdAsync(id, cancellationToken);
        if (project == null) return NotFound(ApiResponse.FailureResponse("Project not found"));

        if (project.CreatedById != userId && role != UserRole.Admin)
            return Forbid();

        project.Name = request.Name;
        project.Description = request.Description;
        project.Deadline = request.Deadline;

        _uow.Projects.Update(project);
        await _uow.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse.SuccessResponse("Project updated successfully."));
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

        var project = await _uow.Projects.GetByIdAsync(id, cancellationToken);
        if (project == null) return NotFound(ApiResponse.FailureResponse("Project not found"));

        if (project.CreatedById != userId && role != UserRole.Admin)
            return Forbid();

        project.Status = request.Status;

        _uow.Projects.Update(project);
        await _uow.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse.SuccessResponse("Project status updated successfully."));
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

        var project = await _uow.Projects.GetByIdAsync(id, cancellationToken);
        if (project == null) return NotFound(ApiResponse.FailureResponse("Project not found"));

        if (project.CreatedById != userId && role != UserRole.Admin)
            return Forbid();

        _uow.Projects.Delete(project);
        await _uow.SaveChangesAsync(cancellationToken);

        return Ok(ApiResponse.SuccessResponse("Project deleted successfully."));
    }

    // ==================== GUIDELINE ENDPOINTS ====================

    /// <summary>
    /// Upload guideline file for a project (PDF, DOCX, TXT, MD).
    /// Files are stored in private storage and require authentication to download.
    /// </summary>
    [HttpPost("{id:int}/guideline/upload")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UploadGuidelineFile(
        int id,
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse.FailureResponse("No file uploaded"));

        // Validate file type
        var allowedExtensions = new[] { ".pdf", ".docx", ".doc", ".txt", ".md", ".html" };
        var extension = Path.GetExtension(file.FileName).ToLower();

        if (!allowedExtensions.Contains(extension))
            return BadRequest(ApiResponse.FailureResponse(
                $"File type not allowed. Allowed: {string.Join(", ", allowedExtensions)}"));

        // Validate file size (max 10MB)
        if (file.Length > 10 * 1024 * 1024)
            return BadRequest(ApiResponse.FailureResponse("File size must be less than 10MB"));

        var userId = GetUserId();
        var role = GetUserRole();

        var project = await _uow.Projects.GetByIdAsync(id, cancellationToken);
        if (project == null)
            return NotFound(ApiResponse.FailureResponse("Project not found"));

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

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            fileName,
            fileSize,
            downloadUrl = $"/api/projects/{id}/guideline/download",
            version = existingGuideline?.Version + 1 ?? 1
        }, "Guideline file uploaded successfully"));
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
            return NotFound(ApiResponse.FailureResponse("Guideline not found"));

        if (string.IsNullOrEmpty(guideline.FilePath))
            return NotFound(ApiResponse.FailureResponse("Guideline file not found"));

        // Check if file exists in private storage
        if (!_fileStorage.PrivateFileExists(guideline.FilePath))
            return NotFound(ApiResponse.FailureResponse("File not found on server"));

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

        return Ok(ApiResponse<GuidelineDto>.SuccessResponse(dto));
    }
}
