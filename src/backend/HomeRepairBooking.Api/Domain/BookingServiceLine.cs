namespace HomeRepairBooking.Api.Domain;

public class BookingServiceLine
{
    public int Id { get; set; }

    public int BookingId { get; set; }

    public Booking Booking { get; set; } = null!;

    public int RepairServiceId { get; set; }

    public RepairService RepairService { get; set; } = null!;

    public string ServiceName { get; set; } = string.Empty;

    public PricingType PricingType { get; set; }

    public decimal? UnitPrice { get; set; }
}
