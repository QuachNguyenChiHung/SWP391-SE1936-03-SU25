using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.Reviews;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DataLabeling.API.Controllers;

/// <summary>
/// Controller for review operations.
/// </summary>
[Route("api")]
[ApiController]
[Authorize]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
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

    // ==================== Pending Review Items ====================

    /// <summary>
    /// Get paginated list of items pending review.
    /// </summary>
    [HttpGet("reviews/pending")]
    [Authorize(Roles = "Admin,Reviewer")]
    [ProducesResponseType(typeof(PagedResult<PendingReviewItemDto>), 200)]
    public async Task<ActionResult<PagedResult<PendingReviewItemDto>>> GetPendingItems(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] int? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _reviewService.GetPendingReviewItemsAsync(
            pageNumber, pageSize, projectId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get review editor data for a data item.
    /// Returns image, annotations, error types, and previous reviews.
    /// </summary>
    [HttpGet("data-items/{dataItemId:int}/review-editor")]
    [Authorize(Roles = "Admin,Reviewer")]
    [ProducesResponseType(typeof(ReviewEditorDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ReviewEditorDto>> GetReviewEditorData(
        int dataItemId,
        CancellationToken cancellationToken = default)
    {
        var data = await _reviewService.GetReviewEditorDataAsync(dataItemId, cancellationToken);
        if (data == null)
            return NotFound(new { success = false, message = "Data item not found" });

        return Ok(data);
    }

    // ==================== Review Operations ====================

    /// <summary>
    /// Create a review for a data item (approve or reject).
    /// </summary>
    [HttpPost("data-items/{dataItemId:int}/reviews")]
    [Authorize(Roles = "Admin,Reviewer")]
    [ProducesResponseType(typeof(ReviewDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ReviewDto>> CreateReview(
        int dataItemId,
        [FromBody] CreateReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token" });

        try
        {
            var review = await _reviewService.CreateReviewAsync(dataItemId, request, userId, cancellationToken);
            return CreatedAtAction(nameof(GetReview), new { id = review.Id }, review);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Get a review by ID.
    /// </summary>
    [HttpGet("reviews/{id:int}")]
    [ProducesResponseType(typeof(ReviewDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ReviewDto>> GetReview(
        int id,
        CancellationToken cancellationToken = default)
    {
        var review = await _reviewService.GetByIdAsync(id, cancellationToken);
        if (review == null)
            return NotFound(new { success = false, message = "Review not found" });

        return Ok(review);
    }

    /// <summary>
    /// Get all reviews for a data item.
    /// </summary>
    [HttpGet("data-items/{dataItemId:int}/reviews")]
    [ProducesResponseType(typeof(IEnumerable<ReviewDto>), 200)]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> GetReviewsByDataItem(
        int dataItemId,
        CancellationToken cancellationToken = default)
    {
        var reviews = await _reviewService.GetByDataItemIdAsync(dataItemId, cancellationToken);
        return Ok(reviews);
    }

    /// <summary>
    /// Get the latest review for a data item.
    /// </summary>
    [HttpGet("data-items/{dataItemId:int}/reviews/latest")]
    [ProducesResponseType(typeof(ReviewDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ReviewDto>> GetLatestReview(
        int dataItemId,
        CancellationToken cancellationToken = default)
    {
        var review = await _reviewService.GetLatestByDataItemIdAsync(dataItemId, cancellationToken);
        if (review == null)
            return NotFound(new { success = false, message = "No review found for this data item" });

        return Ok(review);
    }

    // ==================== Error Types ====================

    /// <summary>
    /// Get all available error types.
    /// </summary>
    [HttpGet("error-types")]
    [ProducesResponseType(typeof(IEnumerable<ErrorTypeDto>), 200)]
    public async Task<ActionResult<IEnumerable<ErrorTypeDto>>> GetErrorTypes(
        CancellationToken cancellationToken = default)
    {
        var errorTypes = await _reviewService.GetErrorTypesAsync(cancellationToken);
        return Ok(errorTypes);
    }

    // ==================== Statistics ====================

    /// <summary>
    /// Get reviewer statistics for the current user.
    /// </summary>
    [HttpGet("reviews/my-stats")]
    [Authorize(Roles = "Admin,Reviewer")]
    [ProducesResponseType(typeof(ReviewerStatsDto), 200)]
    public async Task<ActionResult<ReviewerStatsDto>> GetMyStatistics(
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User ID not found in token" });

        try
        {
            var stats = await _reviewService.GetReviewerStatisticsAsync(userId, cancellationToken);
            return Ok(stats);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Get reviewer statistics for a specific user (Admin only).
    /// </summary>
    [HttpGet("reviews/stats/{reviewerId:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ReviewerStatsDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ReviewerStatsDto>> GetReviewerStatistics(
        int reviewerId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var stats = await _reviewService.GetReviewerStatisticsAsync(reviewerId, cancellationToken);
            return Ok(stats);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }
}
