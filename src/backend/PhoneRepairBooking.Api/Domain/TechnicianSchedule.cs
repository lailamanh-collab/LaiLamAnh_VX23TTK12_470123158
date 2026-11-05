namespace PhoneRepairBooking.Api.Domain;

public class TechnicianSchedule
{
    public int Id { get; set; }

    public int TechnicianId { get; set; }

    public Technician Technician { get; set; } = null!;

    public DayOfWeek DayOfWeek { get; set; }

    public bool IsWorking { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }
}
