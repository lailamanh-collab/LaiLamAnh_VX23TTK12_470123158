namespace PhoneRepairBooking.Api.Domain;

public class ServiceAreaOpeningHour
{
    public int Id { get; set; }

    public int ServiceAreaId { get; set; }

    public ServiceArea ServiceArea { get; set; } = null!;

    public DayOfWeek DayOfWeek { get; set; }

    public bool IsOpen { get; set; } = true;

    public TimeOnly OpenTime { get; set; }

    public TimeOnly CloseTime { get; set; }
}
