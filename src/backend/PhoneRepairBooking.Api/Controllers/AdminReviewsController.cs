using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhoneRepairBooking.Api.Domain;
using PhoneRepairBooking.Api.DTOs;
using PhoneRepairBooking.Api.Services;

namespace PhoneRepairBooking.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/reviews")]
public class AdminReviewsController : ControllerBase
{
    private readonly ReviewService _reviews;

    public AdminReviewsController(ReviewService reviews)
    {
        _reviews = reviews;
    }

    [HttpGet]
    public async Task<ActionResult<List<ReviewDto>>> GetReviews([FromQuery] AdminReviewFilterRequest filter)
    {
        var list = await _reviews.GetAdminReviewsAsync(filter);
        return Ok(list);
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ReviewSummaryStatsDto>> GetStats()
    {
        var stats = await _reviews.GetAdminReviewStatsAsync();
        return Ok(stats);
    }

    [HttpPut("{id:int}/visibility")]
    public async Task<IActionResult> UpdateVisibility(int id, [FromBody] UpdateReviewVisibilityRequest request)
    {
        var (ok, error, status) = await _reviews.ToggleVisibilityAsync(id, request.IsVisible);
        if (!ok)
        {
            return StatusCode(status, error);
        }

        return Ok(new { message = request.IsVisible ? "Đã hiện đánh giá." : "Đã ẩn đánh giá." });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteReview(int id)
    {
        var (ok, error, status) = await _reviews.DeleteReviewAsync(id);
        if (!ok)
        {
            return StatusCode(status, error);
        }

        return Ok(new { message = "Đã xóa đánh giá thành công." });
    }
}
