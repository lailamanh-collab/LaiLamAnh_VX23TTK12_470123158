using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HomeRepairBooking.Api.Domain;
using HomeRepairBooking.Api.DTOs;
using HomeRepairBooking.Api.Services;

namespace HomeRepairBooking.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/customers")]
public class AdminCustomersController : ControllerBase
{
    private readonly AdminBookingService _adminBookings;

    public AdminCustomersController(AdminBookingService adminBookings)
    {
        _adminBookings = adminBookings;
    }

    [HttpGet]
    public async Task<ActionResult<List<CustomerSummaryDto>>> Get([FromQuery] string? search)
    {
        return Ok(await _adminBookings.GetCustomersAsync(search));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CustomerDetailDto>> GetDetail(string id)
    {
        var detail = await _adminBookings.GetCustomerDetailAsync(id);
        return detail is null ? NotFound(new ApiError { Message = "Không tìm thấy khách hàng." }) : Ok(detail);
    }

    [HttpPost("{id}/toggle-status")]
    public async Task<IActionResult> ToggleStatus(string id)
    {
        var (ok, error, status) = await _adminBookings.ToggleCustomerStatusAsync(id);
        return ok ? NoContent() : StatusCode(status, error);
    }

    [HttpGet("admins")]
    public async Task<ActionResult<List<AdminSummaryDto>>> GetAdmins([FromQuery] string? search)
    {
        return Ok(await _adminBookings.GetAdminsAsync(search));
    }

    [HttpPost("admins")]
    public async Task<IActionResult> CreateAdmin(CreateAdminRequest request)
    {
        var (data, error, status) = await _adminBookings.CreateAdminAsync(request);
        return error is null ? StatusCode(status, data) : StatusCode(status, error);
    }

    [HttpPost("admins/{id}/toggle-status")]
    public async Task<IActionResult> ToggleAdminStatus(string id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var (ok, error, status) = await _adminBookings.ToggleAdminStatusAsync(id, currentUserId);
        return ok ? NoContent() : StatusCode(status, error);
    }
}
