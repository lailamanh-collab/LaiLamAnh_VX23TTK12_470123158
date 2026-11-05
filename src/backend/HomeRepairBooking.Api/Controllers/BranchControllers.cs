using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HomeRepairBooking.Api.Domain;
using HomeRepairBooking.Api.DTOs;
using HomeRepairBooking.Api.Services;

namespace HomeRepairBooking.Api.Controllers;

[ApiController]
[Route("api/branches")]
[Route("api/service-areas")]
public class BranchesController : ControllerBase
{
    private readonly BranchService _branches;

    public BranchesController(BranchService branches)
    {
        _branches = branches;
    }

    [HttpGet]
    public async Task<ActionResult<List<ServiceAreaDto>>> Get() => Ok(await _branches.GetServiceAreasAsync(false));
}

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/branches")]
[Route("api/admin/service-areas")]
public class AdminBranchesController : ControllerBase
{
    private readonly BranchService _branches;

    public AdminBranchesController(BranchService branches)
    {
        _branches = branches;
    }

    [HttpGet]
    public async Task<ActionResult<List<ServiceAreaDto>>> Get() => Ok(await _branches.GetServiceAreasAsync(true));

    [HttpPost]
    public async Task<IActionResult> Create(ServiceAreaRequest request)
    {
        if (request.OpeningHours.Count == 0)
        {
            request.OpeningHours = BranchService.DefaultHours();
        }

        return Write(await _branches.SaveServiceAreaAsync(null, request));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ServiceAreaRequest request) =>
        Write(await _branches.SaveServiceAreaAsync(id, request));

    private IActionResult Write((ServiceAreaDto? Data, ApiError? Error, int Status) result) =>
        result.Error is null ? StatusCode(result.Status, result.Data) : StatusCode(result.Status, result.Error);
}

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/technicians")]
public class AdminTechniciansController : ControllerBase
{
    private readonly BranchService _branches;

    public AdminTechniciansController(BranchService branches)
    {
        _branches = branches;
    }

    [HttpGet]
    public async Task<ActionResult<List<TechnicianDto>>> Get() => Ok(await _branches.GetTechniciansAsync(true));

    [HttpPost]
    public async Task<IActionResult> Create(CreateTechnicianRequest request)
    {
        var (data, error, status) = await _branches.CreateTechnicianAsync(request);
        return error is null ? StatusCode(status, data) : StatusCode(status, error);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateTechnicianRequest request)
    {
        var (data, error, status) = await _branches.UpdateTechnicianAsync(id, request);
        return error is null ? StatusCode(status, data) : StatusCode(status, error);
    }

    [HttpPut("{id:int}/schedule")]
    public async Task<IActionResult> Schedule(int id, ScheduleRequest request)
    {
        var (data, error, status) = await _branches.SaveScheduleAsync(id, request);
        return error is null ? StatusCode(status, data) : StatusCode(status, error);
    }
}
