using HomeRepairBooking.Api.Domain;

namespace HomeRepairBooking.Api.DTOs;

public record ServiceCategoryDto(
    int Id,
    string Name,
    string Slug,
    string? Description,
    string? IconName,
    string? ImageUrl,
    bool IsActive,
    int ServicesCount);

public class CategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IconName { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
}

public record RepairServiceDto(
    int Id,
    int ServiceCategoryId,
    string ServiceCategoryName,
    string Name,
    string Slug,
    string? Description,
    decimal? BasePrice,
    PricingType PricingType,
    string? EstimatedDuration,
    string? ImageUrl,
    bool IsActive);

public class RepairServiceRequest
{
    public int ServiceCategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? BasePrice { get; set; }
    public PricingType PricingType { get; set; } = PricingType.FixedPrice;
    public string? EstimatedDuration { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
}

public record CatalogSearchItemDto(
    int Id,
    string Name,
    string Slug,
    int ServiceCategoryId,
    string ServiceCategoryName,
    decimal? BasePrice,
    PricingType PricingType,
    string? Description);

// Backward-compat aliases if needed by legacy callers
public record BrandDto(int Id, string Name, string Slug, string? Description, bool IsActive, int ModelsCount = 0)
    : ServiceCategoryDto(Id, Name, Slug, Description, null, null, IsActive, ModelsCount);

public class BrandRequest : CategoryRequest { }
