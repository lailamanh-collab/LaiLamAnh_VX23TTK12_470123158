using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HomeRepairBooking.Api.Domain;
using HomeRepairBooking.Api.DTOs;
using HomeRepairBooking.Api.Services;

namespace HomeRepairBooking.Api.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly ReviewService _reviews;

    public ReviewsController(ReviewService reviews)
    {
        _reviews = reviews;
    }

    [AllowAnonymous]
    [HttpGet("public")]
    public async Task<ActionResult<List<ReviewDto>>> GetPublic([FromQuery] int? limit)
    {
        return Ok(await _reviews.GetPublicReviewsAsync(limit));
    }

    [Authorize(Roles = AppRoles.Customer)]
    [HttpGet("mine")]
    public async Task<ActionResult<List<ReviewDto>>> GetMyReviews()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        return Ok(await _reviews.GetCustomerReviewsAsync(userId));
    }

    [Authorize(Roles = AppRoles.Customer)]
    [HttpGet("bookings/{bookingId:int}")]
    public async Task<ActionResult<ReviewDto>> GetBookingReview(int bookingId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var review = await _reviews.GetBookingReviewAsync(userId, bookingId);
        if (review is null)
        {
            return NotFound(new ApiError { Message = "Chưa có đánh giá cho lịch hẹn này." });
        }

        return Ok(review);
    }

    [Authorize(Roles = AppRoles.Customer)]
    [HttpPost("bookings/{bookingId:int}")]
    public async Task<ActionResult<ReviewDto>> SubmitReview(int bookingId, [FromBody] SubmitReviewRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var (ok, error, status, data) = await _reviews.SubmitReviewAsync(userId, bookingId, request);
        if (!ok)
        {
            return StatusCode(status, error);
        }

        return StatusCode(status, data);
    }
}
