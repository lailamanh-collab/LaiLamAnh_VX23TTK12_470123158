namespace HomeRepairBooking.Api.Domain;

public class ServiceArea
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public int CapacityPerSlot { get; set; } = 4;

    public int SlotMinutes { get; set; } = 60;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public ICollection<ServiceAreaOpeningHour> OpeningHours { get; set; } = new List<ServiceAreaOpeningHour>();

    public ICollection<Technician> Technicians { get; set; } = new List<Technician>();
}
