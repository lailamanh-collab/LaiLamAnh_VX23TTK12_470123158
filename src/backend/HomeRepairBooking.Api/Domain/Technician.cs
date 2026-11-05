namespace HomeRepairBooking.Api.Domain;

public class Technician
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;

    public ApplicationUser User { get; set; } = null!;

    public int ServiceAreaId { get; set; }

    public ServiceArea ServiceArea { get; set; } = null!;

    public string? Specialty { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public ICollection<TechnicianSchedule> Schedules { get; set; } = new List<TechnicianSchedule>();
}
