using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.DataItems;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DataLabeling.API.Controllers;

/// <summary>
/// Controller for DataItem and Dataset operations.
/// </summary>
[Route("api")]
[ApiController]
[Authorize]
public class DataItemsController : ControllerBase
{
    private readonly IDataItemService _dataItemService;
    private readonly IUnitOfWork _uow;

    public DataItemsController(IDataItemService dataItemService, IUnitOfWork uow)
    {
        _dataItemService = dataItemService;
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
    /// Get dataset information for a project.
    /// </summary>
    [HttpGet("projects/{projectId:int}/dataset")]
    [ProducesResponseType(typeof(DatasetDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<DatasetDto>> GetDataset(
        int projectId,
        CancellationToken cancellationToken = default)
    {
        var project = await _uow.Projects.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
            return NotFound(new { success = false, message = "Project not found" });

        var dataset = await _dataItemService.GetDatasetByProjectIdAsync(projectId, cancellationToken);
        if (dataset == null)
            return NotFound(new { success = false, message = "Dataset not found for this project" });

        return Ok(dataset);
    }

    /// <summary>
    /// Upload images to a project's dataset.
    /// Creates dataset if it doesn't exist.
    /// </summary>
    [HttpPost("projects/{projectId:int}/dataset/upload")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(UploadResultDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [RequestSizeLimit(100 * 1024 * 1024)] // 100MB limit for batch upload
    public async Task<ActionResult<UploadResultDto>> UploadImages(
        int projectId,
        [FromForm] IFormFileCollection files,
        CancellationToken cancellationToken = default)
    {
        if (files == null || files.Count == 0)
            return BadRequest(new { success = false, message = "No files uploaded" });

        var userId = GetUserId();
        var role = GetUserRole();

        var project = await _uow.Projects.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
            return NotFound(new { success = false, message = "Project not found" });

        // Check permission (only owner or admin can upload)
        if (project.CreatedById != userId && role != UserRole.Admin)
            return Forbid();

        try
        {
            var result = await _dataItemService.UploadFilesAsync(projectId, files, cancellationToken);

            return Ok(new
            {
                success = true,
                message = $"Upload completed. {result.UploadedCount} files uploaded, {result.FailedCount} failed.",
                data = result
            });
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Get paginated list of data items for a project.
    /// </summary>
    [HttpGet("projects/{projectId:int}/data-items")]
    [ProducesResponseType(typeof(PagedResult<DataItemDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<PagedResult<DataItemDto>>> GetDataItems(
        int projectId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] DataItemStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var project = await _uow.Projects.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
            return NotFound(new { success = false, message = "Project not found" });

        var result = await _dataItemService.GetDataItemsAsync(
            projectId, pageNumber, pageSize, status, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Get detailed information for a specific data item including annotations and reviews.
    /// </summary>
    [HttpGet("data-items/{id:int}")]
    [ProducesResponseType(typeof(DataItemDetailDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<DataItemDetailDto>> GetDataItemDetail(
        int id,
        CancellationToken cancellationToken = default)
    {
        var result = await _dataItemService.GetDataItemDetailAsync(id, cancellationToken);

        if (result == null)
            return NotFound(new { success = false, message = "Data item not found" });

        return Ok(result);
    }

    /// <summary>
    /// Delete a single data item.
    /// </summary>
    [HttpDelete("data-items/{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteDataItem(
        int id,
        CancellationToken cancellationToken = default)
    {
        var dataItem = await _uow.DataItems.GetByIdAsync(id, cancellationToken);
        if (dataItem == null)
            return NotFound(new { success = false, message = "Data item not found" });

        // Get dataset to check project ownership
        var dataset = await _uow.Datasets.GetByIdAsync(dataItem.DatasetId, cancellationToken);
        if (dataset == null)
            return NotFound(new { success = false, message = "Dataset not found" });

        var project = await _uow.Projects.GetByIdAsync(dataset.ProjectId, cancellationToken);
        if (project == null)
            return NotFound(new { success = false, message = "Project not found" });

        var userId = GetUserId();
        var role = GetUserRole();

        // Check permission (only owner or admin can delete)
        if (project.CreatedById != userId && role != UserRole.Admin)
            return Forbid();

        try
        {
            await _dataItemService.DeleteDataItemAsync(id, cancellationToken);
            return NoContent();
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Delete entire dataset for a project.
    /// </summary>
    [HttpDelete("projects/{projectId:int}/dataset")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(204)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteDataset(
        int projectId,
        CancellationToken cancellationToken = default)
    {
        var project = await _uow.Projects.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
            return NotFound(new { success = false, message = "Project not found" });

        var userId = GetUserId();
        var role = GetUserRole();

        // Check permission (only owner or admin can delete)
        if (project.CreatedById != userId && role != UserRole.Admin)
            return Forbid();

        try
        {
            await _dataItemService.DeleteDatasetAsync(projectId, cancellationToken);
            return NoContent();
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Update status of a single data item.
    /// </summary>
    [HttpPatch("data-items/{id:int}/status")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] UpdateDataItemStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _dataItemService.UpdateStatusAsync(id, request.Status, cancellationToken);
            return NoContent();
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Bulk update status of multiple data items.
    /// </summary>
    [HttpPatch("data-items/bulk-status")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> BulkUpdateStatus(
        [FromBody] BulkUpdateStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Ids == null || request.Ids.Length == 0)
            return BadRequest(new { success = false, message = "No item IDs provided" });

        await _dataItemService.BulkUpdateStatusAsync(request.Ids, request.Status, cancellationToken);
        return NoContent();
    }
}

/// <summary>
/// Request for updating a single data item status.
/// </summary>
public class UpdateDataItemStatusRequest
{
    public DataItemStatus Status { get; set; }
}

/// <summary>
/// Request for bulk updating data item statuses.
/// </summary>
public class BulkUpdateStatusRequest
{
    public int[] Ids { get; set; } = Array.Empty<int>();
    public DataItemStatus Status { get; set; }
}
