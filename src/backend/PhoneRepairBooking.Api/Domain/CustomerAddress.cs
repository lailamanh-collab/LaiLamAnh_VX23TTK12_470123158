namespace PhoneRepairBooking.Api.Domain;

public class CustomerAddress
{
    public int Id { get; set; }

    public string CustomerId { get; set; } = string.Empty;

    public ApplicationUser Customer { get; set; } = null!;

    public string FullName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Province { get; set; } = string.Empty;

    public string District { get; set; } = string.Empty;

    public string Ward { get; set; } = string.Empty;

    public string AddressLine { get; set; } = string.Empty;

    public string? Note { get; set; }

    public bool IsDefault { get; set; } = false;

    public DateTime CreatedAt { get; set; }
}
