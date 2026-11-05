using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhoneRepairBooking.Api.Domain;
using PhoneRepairBooking.Api.DTOs;
using PhoneRepairBooking.Api.Services;

namespace PhoneRepairBooking.Api.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingsController : ControllerBase
{
    private readonly BookingService _bookings;

    public BookingsController(BookingService bookings)
    {
        _bookings = bookings;
    }

    [HttpGet("slots")]
    public async Task<ActionResult<List<SlotDto>>> Slots(
        [FromQuery] int? serviceAreaId,
        [FromQuery] int? branchId,
        [FromQuery] string date)
    {
        var area = serviceAreaId ?? branchId ?? 0;
        if (area <= 0)
        {
            return BadRequest(new ApiError { Message = "Vui lòng chọn khu vực phục vụ." });
        }

        if (!DateOnly.TryParse(date, out var parsed))
        {
            return BadRequest(new ApiError { Message = "Ngày không hợp lệ." });
        }

        return Ok(await _bookings.GetSlotsAsync(area, parsed));
    }

    [Authorize(Roles = AppRoles.Customer)]
    [HttpPost]
    public async Task<IActionResult> Create(CreateBookingRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var (data, error, status) = await _bookings.CreateAsync(userId, request);
        return error is null ? StatusCode(status, data) : StatusCode(status, error);
    }

    [Authorize(Roles = AppRoles.Customer)]
    [HttpGet("mine")]
    public async Task<ActionResult<List<BookingSummaryDto>>> Mine([FromQuery] string? filter)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        return Ok(await _bookings.GetMineAsync(userId, filter));
    }

    [Authorize(Roles = AppRoles.Customer)]
    [HttpGet("mine/{id:int}")]
    public async Task<ActionResult<BookingDetailDto>> MineDetail(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var detail = await _bookings.GetMineDetailAsync(userId, id);
        return detail is null ? NotFound(new ApiError { Message = "Không tìm thấy lịch hẹn." }) : Ok(detail);
    }

    [Authorize(Roles = AppRoles.Customer)]
    [HttpPost("mine/{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, CancelBookingRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var (ok, error, status) = await _bookings.CancelMineAsync(userId, id, request.Reason);
        return ok ? NoContent() : StatusCode(status, error);
    }
}
