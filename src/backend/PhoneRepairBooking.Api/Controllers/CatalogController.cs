using Microsoft.AspNetCore.Mvc;
using PhoneRepairBooking.Api.Domain;
using PhoneRepairBooking.Api.DTOs;
using PhoneRepairBooking.Api.Services;

namespace PhoneRepairBooking.Api.Controllers;

[ApiController]
[Route("api/catalog")]
public class CatalogController : ControllerBase
{
    private readonly CatalogService _catalog;

    public CatalogController(CatalogService catalog)
    {
        _catalog = catalog;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<ServiceCategoryDto>>> Categories([FromQuery] string? search)
    {
        return Ok(await _catalog.GetCategoriesAsync(false, search));
    }

    // Alias for brands
    [HttpGet("brands")]
    public async Task<ActionResult<List<ServiceCategoryDto>>> Brands([FromQuery] string? search)
    {
        return Ok(await _catalog.GetCategoriesAsync(false, search));
    }

    [HttpGet("services")]
    public async Task<ActionResult<List<RepairServiceDto>>> Services(
        [FromQuery] int? categoryId,
        [FromQuery] int? brandId,
        [FromQuery] string? search,
        [FromQuery] PricingType? pricingType)
    {
        var cat = categoryId ?? brandId;
        return Ok(await _catalog.GetServicesAsync(false, cat, search, pricingType));
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<CatalogSearchItemDto>>> Search(
        [FromQuery] string? q,
        [FromQuery] int? categoryId,
        [FromQuery] int? brandId,
        [FromQuery] PricingType? pricingType)
    {
        var cat = categoryId ?? brandId;
        return Ok(await _catalog.SearchAsync(q, cat, pricingType));
    }

    // Legacy fallbacks returning safe empty lists
    [HttpGet("models")]
    public ActionResult<List<object>> Models() => Ok(new List<object>());

    [HttpGet("prices")]
    public ActionResult<List<object>> Prices() => Ok(new List<object>());
}
