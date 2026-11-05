namespace HomeRepairBooking.Api.Domain;

public class Booking
{
    public int Id { get; set; }

    public string BookingCode { get; set; } = string.Empty;

    public string CustomerId { get; set; } = string.Empty;

    public ApplicationUser Customer { get; set; } = null!;

    public string CustomerName { get; set; } = string.Empty;

    public string CustomerPhone { get; set; } = string.Empty;

    public string AddressLine { get; set; } = string.Empty;

    public string? Ward { get; set; }

    public string? District { get; set; }

    public string? City { get; set; }

    public int ServiceAreaId { get; set; }

    public ServiceArea ServiceArea { get; set; } = null!;

    public int? TechnicianId { get; set; }

    public Technician? Technician { get; set; }

    public DateOnly AppointmentDate { get; set; }

    public TimeOnly SlotStart { get; set; }

    public TimeOnly SlotEnd { get; set; }

    public BookingStatus Status { get; set; } = BookingStatus.Pending;

    public string ProblemDescription { get; set; } = string.Empty;

    public decimal EstimatedTotal { get; set; }

    public decimal? ActualCost { get; set; }

    public string? Diagnosis { get; set; }

    public string? RepairNotes { get; set; }

    public string? RepairSolution { get; set; }

    public DateTime? OnTheWayAt { get; set; }

    public DateTime? InspectionStartedAt { get; set; }

    public DateTime? RepairStartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime? CancelledAt { get; set; }

    public string? CancelReason { get; set; }

    public DateTime CreatedAt { get; set; }

    public ICollection<BookingServiceLine> Services { get; set; } = new List<BookingServiceLine>();

    public ICollection<BookingStatusHistory> StatusHistory { get; set; } = new List<BookingStatusHistory>();

    public Review? Review { get; set; }
}
