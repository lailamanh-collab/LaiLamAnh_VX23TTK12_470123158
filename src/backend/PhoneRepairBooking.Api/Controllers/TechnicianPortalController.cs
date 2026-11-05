using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhoneRepairBooking.Api.Domain;
using PhoneRepairBooking.Api.DTOs;
using PhoneRepairBooking.Api.Services;

namespace PhoneRepairBooking.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Technician)]
[Route("api/technician")]
public class TechnicianPortalController : ControllerBase
{
    private readonly BranchService _branches;
    private readonly TechnicianJobService _jobs;

    public TechnicianPortalController(BranchService branches, TechnicianJobService jobs)
    {
        _branches = branches;
        _jobs = jobs;
    }

    [HttpGet("me")]
    public async Task<ActionResult<TechnicianDto>> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var profile = await _branches.GetOwnProfileAsync(userId);
        if (profile is null)
        {
            return NotFound(new ApiError { Message = "Chưa có hồ sơ kỹ thuật viên." });
        }

        return Ok(profile);
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<TechnicianDashboardDto>> GetDashboard()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var (ok, error, status, data) = await _jobs.GetDashboardAsync(userId);
        if (!ok)
        {
            return StatusCode(status, error);
        }

        return Ok(data);
    }

    [HttpGet("jobs")]
    public async Task<ActionResult<List<TechnicianJobSummaryDto>>> GetJobs([FromQuery] TechnicianJobFilterRequest filter)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var (ok, error, status, data) = await _jobs.GetJobsAsync(userId, filter);
        if (!ok)
        {
            return StatusCode(status, error);
        }

        return Ok(data);
    }

    [HttpGet("jobs/{id:int}")]
    public async Task<ActionResult<TechnicianJobDetailDto>> GetJobDetail(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var (ok, error, status, data) = await _jobs.GetJobDetailAsync(userId, id);
        if (!ok)
        {
            return StatusCode(status, error);
        }

        return Ok(data);
    }

    [HttpPost("jobs/{id:int}/start-travel")]
    public async Task<ActionResult<TechnicianJobDetailDto>> StartTravel(int id, [FromBody] TechnicianTravelRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var (ok, error, status, data) = await _jobs.StartTravelAsync(userId, id, request);
        if (!ok)
        {
            return StatusCode(status, error);
        }

        return Ok(data);
    }

    [HttpPost("jobs/{id:int}/receive")]
    public async Task<ActionResult<TechnicianJobDetailDto>> ReceiveJob(int id, [FromBody] TechnicianReceiveRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var (ok, error, status, data) = await _jobs.ReceiveJobAsync(userId, id, request);
        if (!ok)
        {
            return StatusCode(status, error);
        }

        return Ok(data);
    }

    [HttpPost("jobs/{id:int}/inspect")]
    public async Task<ActionResult<TechnicianJobDetailDto>> StartInspection(int id, [FromBody] TechnicianInspectRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var (ok, error, status, data) = await _jobs.StartInspectionAsync(userId, id, request);
        if (!ok)
        {
            return StatusCode(status, error);
        }

        return Ok(data);
    }

    [HttpPost("jobs/{id:int}/start-repair")]
    public async Task<ActionResult<TechnicianJobDetailDto>> StartRepair(int id, [FromBody] TechnicianStartRepairRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var (ok, error, status, data) = await _jobs.StartRepairAsync(userId, id, request);
        if (!ok)
        {
            return StatusCode(status, error);
        }

        return Ok(data);
    }

    [HttpPut("jobs/{id:int}/repair-info")]
    public async Task<ActionResult<TechnicianJobDetailDto>> UpdateRepairInfo(int id, [FromBody] TechnicianUpdateRepairRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var (ok, error, status, data) = await _jobs.UpdateRepairProgressAsync(userId, id, request);
        if (!ok)
        {
            return StatusCode(status, error);
        }

        return Ok(data);
    }

    [HttpPost("jobs/{id:int}/complete")]
    public async Task<ActionResult<TechnicianJobDetailDto>> CompleteRepair(int id, [FromBody] TechnicianCompleteRepairRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var (ok, error, status, data) = await _jobs.CompleteRepairAsync(userId, id, request);
        if (!ok)
        {
            return StatusCode(status, error);
        }

        return Ok(data);
    }
}
