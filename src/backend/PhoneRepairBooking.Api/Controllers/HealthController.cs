using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhoneRepairBooking.Api.Data;
using PhoneRepairBooking.Api.DTOs;

namespace PhoneRepairBooking.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;

    public HealthController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<HealthStatusDto>> Get(CancellationToken cancellationToken)
    {
        var databaseConnected = false;

        try
        {
            databaseConnected = await _db.Database.CanConnectAsync(cancellationToken);
        }
        catch (Exception)
        {
            databaseConnected = false;
        }

        return Ok(new HealthStatusDto("ok", databaseConnected ? "connected" : "unavailable"));
    }
}
