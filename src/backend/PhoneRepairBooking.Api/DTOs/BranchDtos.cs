namespace PhoneRepairBooking.Api.DTOs;

public record OpeningHourDto(DayOfWeek DayOfWeek, bool IsOpen, string OpenTime, string CloseTime);

public record ServiceAreaDto(
    int Id,
    string Name,
    string City,
    string Address,
    string Phone,
    int CapacityPerSlot,
    int SlotMinutes,
    bool IsActive,
    List<OpeningHourDto> OpeningHours);

public class ServiceAreaRequest
{
    public string Name { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public int CapacityPerSlot { get; set; } = 4;

    public int SlotMinutes { get; set; } = 60;

    public bool IsActive { get; set; } = true;

    public List<OpeningHourDto> OpeningHours { get; set; } = [];
}

// Backward compatibility BranchDto mapping to ServiceArea
public record BranchDto(
    int Id,
    string Name,
    string Address,
    string Phone,
    int CapacityPerSlot,
    int SlotMinutes,
    bool IsActive,
    List<OpeningHourDto> OpeningHours)
    : ServiceAreaDto(Id, Name, "", Address, Phone, CapacityPerSlot, SlotMinutes, IsActive, OpeningHours);

public class BranchRequest : ServiceAreaRequest { }

public record ScheduleDto(DayOfWeek DayOfWeek, bool IsWorking, string StartTime, string EndTime);

public record TechnicianDto(
    int Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    int ServiceAreaId,
    string ServiceAreaName,
    string? Specialty,
    bool IsActive,
    List<ScheduleDto> Schedules)
{
    // Alias for backward compatibility
    public int BranchId => ServiceAreaId;
    public string BranchName => ServiceAreaName;
}

public class CreateTechnicianRequest
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public int ServiceAreaId { get; set; }

    public int BranchId { get => ServiceAreaId; set => ServiceAreaId = value; }

    public string? Specialty { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UpdateTechnicianRequest
{
    public string FullName { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public int ServiceAreaId { get; set; }

    public int BranchId { get => ServiceAreaId; set => ServiceAreaId = value; }

    public string? Specialty { get; set; }

    public bool IsActive { get; set; } = true;
}

public class ScheduleRequest
{
    public List<ScheduleDto> Schedules { get; set; } = [];
}

public record CustomerAddressDto(
    int Id,
    string FullName,
    string Phone,
    string Province,
    string District,
    string Ward,
    string AddressLine,
    string? Note,
    bool IsDefault,
    DateTime CreatedAt);

public class CustomerAddressRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string Ward { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public string? Note { get; set; }
    public bool IsDefault { get; set; }
}
