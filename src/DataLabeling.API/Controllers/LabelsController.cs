using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Label;
using DataLabeling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DataLabeling.API.Controllers;

/// <summary>
/// Controller for label management operations.
/// </summary>
[ApiController]
[Authorize]
public class LabelsController : ControllerBase
{
    private readonly ILabelService _labelService;

    public LabelsController(ILabelService labelService)
    {
        _labelService = labelService;
    }

    /// <summary>
    /// Gets all labels for a project.
    /// </summary>
    /// <param name="projectId">Project ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of labels ordered by DisplayOrder.</returns>
    [HttpGet("api/projects/{projectId:int}/labels")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<LabelDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByProject(int projectId, CancellationToken cancellationToken)
    {
        var result = await _labelService.GetByProjectIdAsync(projectId, cancellationToken);
        return Ok(ApiResponse<IEnumerable<LabelDto>>.SuccessResponse(result));
    }

    /// <summary>
    /// Gets a label by ID.
    /// </summary>
    /// <param name="id">Label ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The label.</returns>
    [HttpGet("api/labels/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<LabelDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _labelService.GetByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<LabelDto>.SuccessResponse(result));
    }

    /// <summary>
    /// Creates a new label for a project.
    /// </summary>
    /// <param name="projectId">Project ID.</param>
    /// <param name="request">Label creation data.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created label.</returns>
    [HttpPost("api/projects/{projectId:int}/labels")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse<LabelDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        int projectId,
        [FromBody] CreateLabelRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _labelService.CreateAsync(projectId, request, cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<LabelDto>.SuccessResponse(result, "Label created successfully."));
    }

    /// <summary>
    /// Updates an existing label.
    /// </summary>
    /// <param name="id">Label ID.</param>
    /// <param name="request">Label update data.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated label.</returns>
    [HttpPut("api/labels/{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse<LabelDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateLabelRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _labelService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<LabelDto>.SuccessResponse(result, "Label updated successfully."));
    }

    /// <summary>
    /// Deletes a label.
    /// </summary>
    /// <param name="id">Label ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Confirmation message.</returns>
    [HttpDelete("api/labels/{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _labelService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Label deleted successfully."));
    }

    /// <summary>
    /// Reorders labels for a project.
    /// </summary>
    /// <param name="projectId">Project ID.</param>
    /// <param name="request">Reorder request with label IDs in desired order.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Confirmation message.</returns>
    [HttpPut("api/projects/{projectId:int}/labels/reorder")]
    [Authorize(Roles = "Admin,Manager")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reorder(
        int projectId,
        [FromBody] ReorderLabelsRequest request,
        CancellationToken cancellationToken)
    {
        await _labelService.ReorderAsync(projectId, request.LabelIds, cancellationToken);
        return Ok(ApiResponse.SuccessResponse("Labels reordered successfully."));
    }
}
