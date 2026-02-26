using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Export;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DataLabeling.API.Controllers;

/// <summary>
/// Controller for exporting project annotations in various formats.
/// </summary>
[Route("api")]
[ApiController]
[Authorize]
public class ExportController : ControllerBase
{
    private readonly IExportService _exportService;
    private readonly IUnitOfWork _uow;

    public ExportController(IExportService exportService, IUnitOfWork uow)
    {
        _exportService = exportService;
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
    /// Export project annotations to specified format (COCO, YOLO, or Pascal VOC).
    /// </summary>
    /// <param name="projectId">The project ID to export.</param>
    /// <param name="request">Export options including format and filters.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Export result with download URL.</returns>
    [HttpPost("projects/{projectId:int}/export")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse<ExportResultDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ApiResponse<ExportResultDto>>> ExportProject(
        int projectId,
        [FromBody] ExportRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var role = GetUserRole();

        // Check project exists
        var project = await _uow.Projects.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
            return NotFound(ApiResponse<ExportResultDto>.FailureResponse("Project not found"));

        // Check permission (only owner or admin can export)
        if (project.CreatedById != userId && role != UserRole.Admin)
            return Forbid();

        try
        {
            var result = await _exportService.ExportProjectAsync(projectId, request, cancellationToken);

            return Ok(ApiResponse<ExportResultDto>.SuccessResponse(
                result,
                $"Export completed. {result.ImageCount} images with {result.AnnotationCount} annotations exported."));
        }
        catch (NotFoundException ex)
        {
            return NotFound(ApiResponse<ExportResultDto>.FailureResponse(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<ExportResultDto>.FailureResponse(ex.Message));
        }
    }

    /// <summary>
    /// Download an exported file.
    /// </summary>
    /// <param name="fileName">The export file name.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The export ZIP file.</returns>
    [HttpGet("exports/{fileName}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(FileStreamResult), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DownloadExport(
        string fileName,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(fileName))
            return BadRequest(new { success = false, message = "File name is required" });

        // Basic security check - prevent path traversal
        if (fileName.Contains("..") || fileName.Contains("/") || fileName.Contains("\\"))
            return BadRequest(new { success = false, message = "Invalid file name" });

        if (!_exportService.ExportFileExists(fileName))
            return NotFound(new { success = false, message = "Export file not found" });

        try
        {
            var stream = await _exportService.GetExportFileAsync(fileName, cancellationToken);
            return File(stream, "application/zip", fileName);
        }
        catch (NotFoundException)
        {
            return NotFound(new { success = false, message = "Export file not found" });
        }
    }

    /// <summary>
    /// Delete an exported file.
    /// </summary>
    /// <param name="fileName">The export file name to delete.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpDelete("exports/{fileName}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteExport(
        string fileName,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(fileName))
            return BadRequest(new { success = false, message = "File name is required" });

        // Basic security check - prevent path traversal
        if (fileName.Contains("..") || fileName.Contains("/") || fileName.Contains("\\"))
            return BadRequest(new { success = false, message = "Invalid file name" });

        if (!_exportService.ExportFileExists(fileName))
            return NotFound(new { success = false, message = "Export file not found" });

        await _exportService.DeleteExportFileAsync(fileName);
        return NoContent();
    }
}
