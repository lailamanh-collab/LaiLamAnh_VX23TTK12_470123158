using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhoneRepairBooking.Api.Domain;
using PhoneRepairBooking.Api.DTOs;
using PhoneRepairBooking.Api.Services;

namespace PhoneRepairBooking.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/bookings")]
public class AdminBookingsController : ControllerBase
{
    private readonly AdminBookingService _adminBookings;

    public AdminBookingsController(AdminBookingService adminBookings)
    {
        _adminBookings = adminBookings;
    }

    [HttpGet]
    public async Task<ActionResult<List<AdminBookingDto>>> Get([FromQuery] AdminBookingFilterRequest request)
    {
        return Ok(await _adminBookings.GetBookingsAsync(request));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AdminBookingDto>> GetDetail(int id)
    {
        var detail = await _adminBookings.GetBookingDetailAsync(id);
        return detail is null ? NotFound(new ApiError { Message = "Không tìm thấy lịch hẹn." }) : Ok(detail);
    }

    [HttpPost("{id:int}/confirm")]
    public async Task<IActionResult> Confirm(int id, [FromBody] AdminStatusUpdateRequest? request)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var (ok, error, status) = await _adminBookings.ConfirmBookingAsync(id, adminId, request?.Note);
        return ok ? NoContent() : StatusCode(status, error);
    }

    [HttpPost("{id:int}/assign")]
    public async Task<IActionResult> Assign(int id, [FromBody] AssignTechnicianRequest request)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var (ok, error, status) = await _adminBookings.AssignTechnicianAsync(id, request.TechnicianId, adminId, request.Note);
        return ok ? NoContent() : StatusCode(status, error);
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, [FromBody] CancelBookingRequest? request)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var (ok, error, status) = await _adminBookings.CancelBookingAsync(id, adminId, request?.Reason);
        return ok ? NoContent() : StatusCode(status, error);
    }
}
