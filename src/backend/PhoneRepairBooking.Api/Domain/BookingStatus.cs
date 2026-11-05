namespace PhoneRepairBooking.Api.Domain;

public enum BookingStatus
{
    Pending,
    Confirmed,
    Assigned,
    OnTheWay,
    Inspecting,
    Repairing,
    Completed,
    Cancelled
}
