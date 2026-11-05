namespace HomeRepairBooking.Api.Domain;

public class BookingStatusHistory
{
    public int Id { get; set; }

    public int BookingId { get; set; }

    public Booking Booking { get; set; } = null!;

    public BookingStatus? FromStatus { get; set; }

    public BookingStatus ToStatus { get; set; }

    public string? Note { get; set; }

    public string? ChangedByUserId { get; set; }

    public DateTime ChangedAt { get; set; }
}
