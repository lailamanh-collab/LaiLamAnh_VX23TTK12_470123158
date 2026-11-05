using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhoneRepairBooking.Api.Domain;
using PhoneRepairBooking.Api.DTOs;
using PhoneRepairBooking.Api.Services;

namespace PhoneRepairBooking.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin)]
[Route("api/admin/catalog")]
public class AdminCatalogController : ControllerBase
{
    private readonly CatalogService _catalog;

    public AdminCatalogController(CatalogService catalog)
    {
        _catalog = catalog;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<ServiceCategoryDto>>> Categories([FromQuery] string? search) =>
        Ok(await _catalog.GetCategoriesAsync(true, search));

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory(CategoryRequest request) =>
        await Write(await _catalog.CreateCategoryAsync(request));

    [HttpPut("categories/{id:int}")]
    public async Task<IActionResult> UpdateCategory(int id, CategoryRequest request) =>
        await Write(await _catalog.UpdateCategoryAsync(id, request));

    [HttpDelete("categories/{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var (ok, error, status) = await _catalog.DeleteCategoryAsync(id);
        return ok ? NoContent() : StatusCode(status, error);
    }

    // Aliases for brands
    [HttpGet("brands")]
    public async Task<ActionResult<List<ServiceCategoryDto>>> Brands([FromQuery] string? search) =>
        Ok(await _catalog.GetCategoriesAsync(true, search));

    [HttpPost("brands")]
    public async Task<IActionResult> CreateBrand(CategoryRequest request) =>
        await Write(await _catalog.CreateCategoryAsync(request));

    [HttpPut("brands/{id:int}")]
    public async Task<IActionResult> UpdateBrand(int id, CategoryRequest request) =>
        await Write(await _catalog.UpdateCategoryAsync(id, request));

    [HttpDelete("brands/{id:int}")]
    public async Task<IActionResult> DeleteBrand(int id)
    {
        var (ok, error, status) = await _catalog.DeleteCategoryAsync(id);
        return ok ? NoContent() : StatusCode(status, error);
    }

    // SERVICES
    [HttpGet("services")]
    public async Task<ActionResult<List<RepairServiceDto>>> Services(
        [FromQuery] int? categoryId,
        [FromQuery] string? search,
        [FromQuery] PricingType? pricingType) =>
        Ok(await _catalog.GetServicesAsync(true, categoryId, search, pricingType));

    [HttpPost("services")]
    public async Task<IActionResult> CreateService(RepairServiceRequest request) =>
        await Write(await _catalog.SaveServiceAsync(null, request));

    [HttpPut("services/{id:int}")]
    public async Task<IActionResult> UpdateService(int id, RepairServiceRequest request) =>
        await Write(await _catalog.SaveServiceAsync(id, request));

    [HttpDelete("services/{id:int}")]
    public async Task<IActionResult> DeleteService(int id)
    {
        var (ok, error, status) = await _catalog.DeleteServiceAsync(id);
        return ok ? NoContent() : StatusCode(status, error);
    }

    // Fallbacks
    [HttpGet("models")]
    public ActionResult<List<object>> Models() => Ok(new List<object>());

    [HttpGet("prices")]
    public ActionResult<List<object>> Prices() => Ok(new List<object>());

    private async Task<IActionResult> Write<T>((T? Data, ApiError? Error, int Status) result)
    {
        await Task.CompletedTask;
        if (result.Error is not null)
        {
            return StatusCode(result.Status, result.Error);
        }

        return StatusCode(result.Status, result.Data);
    }
}
