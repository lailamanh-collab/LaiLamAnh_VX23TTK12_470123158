using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HomeRepairBooking.Api.Domain;
using HomeRepairBooking.Api.DTOs;
using HomeRepairBooking.Api.Services;

namespace HomeRepairBooking.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/reports")]
public class AdminReportsController : ControllerBase
{
    private readonly ReportService _reports;

    public AdminReportsController(ReportService reports)
    {
        _reports = reports;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<AdminDashboardDto>> GetDashboard()
    {
        var data = await _reports.GetDashboardAsync();
        return Ok(data);
    }

    [HttpGet]
    public async Task<ActionResult<ReportResultDto>> GetReports([FromQuery] ReportFilterRequest filter)
    {
        var data = await _reports.GetReportDataAsync(filter);
        return Ok(data);
    }
}
