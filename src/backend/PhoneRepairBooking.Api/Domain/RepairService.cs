namespace PhoneRepairBooking.Api.Domain;

public class RepairService
{
    public int Id { get; set; }

    public int ServiceCategoryId { get; set; }

    public ServiceCategory ServiceCategory { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal? BasePrice { get; set; }

    public PricingType PricingType { get; set; } = PricingType.FixedPrice;

    public string? EstimatedDuration { get; set; }

    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }
}
