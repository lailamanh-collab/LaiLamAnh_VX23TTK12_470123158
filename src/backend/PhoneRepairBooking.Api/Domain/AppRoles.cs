namespace PhoneRepairBooking.Api.Domain;

public static class AppRoles
{
    public const string Admin = "Admin";
    public const string Technician = "Technician";
    public const string Customer = "Customer";

    public static readonly string[] All = [Admin, Technician, Customer];
}
