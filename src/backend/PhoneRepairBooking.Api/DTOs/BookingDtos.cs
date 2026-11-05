using PhoneRepairBooking.Api.Domain;

namespace PhoneRepairBooking.Api.DTOs;

public record SlotDto(string Start, string End, int Capacity, int Booked, bool IsFull);

public record BookingLineDto(int RepairServiceId, string ServiceName, PricingType PricingType, decimal? UnitPrice);

public record BookingHistoryDto(BookingStatus? FromStatus, BookingStatus ToStatus, string? Note, DateTime ChangedAt);

public record BookingSummaryDto(
    int Id,
    string BookingCode,
    string CustomerName,
    string CustomerPhone,
    string ServiceCategoryName,
    string PrimaryServiceName,
    string ServiceAreaName,
    string FullAddress,
    DateOnly AppointmentDate,
    string SlotStart,
    BookingStatus Status,
    decimal EstimatedTotal,
    decimal? ActualCost,
    string? TechnicianName,
    DateTime CreatedAt,
    bool HasReview = false)
{
    // Backward compatibility aliases
    public string BrandName => ServiceCategoryName;
    public string PhoneModelName => PrimaryServiceName;
    public string BranchName => ServiceAreaName;
}

public record BookingDetailDto(
    int Id,
    string BookingCode,
    string CustomerName,
    string CustomerPhone,
    string AddressLine,
    string? Ward,
    string? District,
    string? City,
    string FullAddress,
    string ServiceCategoryName,
    string ServiceAreaName,
    string ServiceAreaPhone,
    DateOnly AppointmentDate,
    string SlotStart,
    string SlotEnd,
    BookingStatus Status,
    string ProblemDescription,
    decimal EstimatedTotal,
    decimal? ActualCost,
    string? TechnicianName,
    string? TechnicianPhone,
    string? Diagnosis,
    string? RepairNotes,
    string? RepairSolution,
    DateTime? OnTheWayAt,
    DateTime? InspectionStartedAt,
    DateTime? RepairStartedAt,
    DateTime? CompletedAt,
    DateTime CreatedAt,
    List<BookingLineDto> Services,
    List<BookingHistoryDto> Timeline,
    ReviewDto? Review = null)
{
    // Backward compatibility aliases
    public string BrandName => ServiceCategoryName;
    public string PhoneModelName => Services.Count > 0 ? Services[0].ServiceName : "Dịch vụ sửa nhà";
    public string BranchName => ServiceAreaName;
    public string BranchAddress => FullAddress;
}

public class CreateBookingRequest
{
    public int ServiceAreaId { get; set; }

    public int BranchId { get => ServiceAreaId; set => ServiceAreaId = value; }

    public int? PhoneModelId { get; set; } // Ignored in new logic, kept for non-breaking

    public List<int> RepairServiceIds { get; set; } = [];

    public string CustomerName { get; set; } = string.Empty;

    public string CustomerPhone { get; set; } = string.Empty;

    public string AddressLine { get; set; } = string.Empty;

    public string? Ward { get; set; }

    public string? District { get; set; }

    public string? City { get; set; }

    public string AppointmentDate { get; set; } = string.Empty;

    public string SlotStart { get; set; } = string.Empty;

    public string ProblemDescription { get; set; } = string.Empty;
}

public class CancelBookingRequest
{
    public string? Reason { get; set; }
}

public record AdminBookingDto(
    int Id,
    string BookingCode,
    string CustomerId,
    string CustomerName,
    string CustomerEmail,
    string? CustomerPhone,
    string FullAddress,
    string AddressLine,
    string? Ward,
    string? District,
    string? City,
    string ServiceCategoryName,
    int ServiceAreaId,
    string ServiceAreaName,
    DateOnly AppointmentDate,
    string SlotStart,
    string SlotEnd,
    BookingStatus Status,
    string ProblemDescription,
    decimal EstimatedTotal,
    decimal? ActualCost,
    int? TechnicianId,
    string? TechnicianName,
    string? TechnicianPhone,
    string? Diagnosis,
    string? RepairNotes,
    string? RepairSolution,
    DateTime? OnTheWayAt,
    DateTime? InspectionStartedAt,
    DateTime? RepairStartedAt,
    DateTime? CompletedAt,
    DateTime CreatedAt,
    List<BookingLineDto> Services,
    List<BookingHistoryDto> Timeline)
{
    // Backward compatibility aliases
    public int PhoneModelId => 0;
    public string BrandName => ServiceCategoryName;
    public string PhoneModelName => Services.Count > 0 ? Services[0].ServiceName : "Dịch vụ sửa nhà";
    public int BranchId => ServiceAreaId;
    public string BranchName => ServiceAreaName;
}

public class AdminBookingFilterRequest
{
    public string? Search { get; set; }

    public string? Status { get; set; }

    public int? ServiceAreaId { get; set; }

    public int? BranchId { get => ServiceAreaId; set => ServiceAreaId = value; }

    public int? TechnicianId { get; set; }

    public string? Date { get; set; }

    public string? FromDate { get; set; }

    public string? ToDate { get; set; }
}

public class AssignTechnicianRequest
{
    public int TechnicianId { get; set; }

    public string? Note { get; set; }
}

public class AdminStatusUpdateRequest
{
    public string? Note { get; set; }
}

public record CustomerSummaryDto(
    string Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    bool IsActive,
    DateTime CreatedAt,
    int TotalBookings,
    int CompletedBookings);

public record CustomerDetailDto(
    string Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    bool IsActive,
    DateTime CreatedAt,
    List<BookingSummaryDto> Bookings);

public record AdminSummaryDto(
    string Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    bool IsActive,
    DateTime CreatedAt,
    string Role = "Admin");

public class CreateAdminRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Password { get; set; } = string.Empty;
}

public record TechnicianDashboardDto(
    int TechnicianId,
    string TechnicianName,
    int ServiceAreaId,
    string ServiceAreaName,
    int JobsToday,
    int ConfirmedJobs,
    int AssignedJobs,
    int OnTheWayJobs,
    int InspectingJobs,
    int RepairingJobs,
    int CompletedJobs,
    int CompletedTodayJobs,
    int TotalActiveJobs)
{
    // Backward compatibility aliases
    public int BranchId => ServiceAreaId;
    public string BranchName => ServiceAreaName;
    public int ReceivedJobs => OnTheWayJobs;
}

public record TechnicianJobSummaryDto(
    int Id,
    string BookingCode,
    string CustomerName,
    string? CustomerPhone,
    string FullAddress,
    string ServiceCategoryName,
    string PrimaryServiceName,
    string ServiceAreaName,
    DateOnly AppointmentDate,
    string SlotStart,
    string SlotEnd,
    BookingStatus Status,
    string ProblemDescription,
    decimal EstimatedTotal,
    decimal? ActualCost,
    DateTime CreatedAt,
    DateTime? OnTheWayAt,
    DateTime? InspectionStartedAt,
    DateTime? RepairStartedAt,
    DateTime? CompletedAt)
{
    // Backward compatibility aliases
    public string BrandName => ServiceCategoryName;
    public string PhoneModelName => PrimaryServiceName;
    public string BranchName => ServiceAreaName;
    public DateTime? ReceivedAt => OnTheWayAt;
}

public record TechnicianJobDetailDto(
    int Id,
    string BookingCode,
    string CustomerId,
    string CustomerName,
    string CustomerEmail,
    string? CustomerPhone,
    string FullAddress,
    string AddressLine,
    string? Ward,
    string? District,
    string? City,
    string ServiceCategoryName,
    int ServiceAreaId,
    string ServiceAreaName,
    string ServiceAreaPhone,
    DateOnly AppointmentDate,
    string SlotStart,
    string SlotEnd,
    BookingStatus Status,
    string ProblemDescription,
    decimal EstimatedTotal,
    decimal? ActualCost,
    string? Diagnosis,
    string? RepairNotes,
    string? RepairSolution,
    DateTime CreatedAt,
    DateTime? OnTheWayAt,
    DateTime? InspectionStartedAt,
    DateTime? RepairStartedAt,
    DateTime? CompletedAt,
    List<BookingLineDto> Services,
    List<BookingHistoryDto> Timeline)
{
    // Backward compatibility aliases
    public int PhoneModelId => 0;
    public string BrandName => ServiceCategoryName;
    public string PhoneModelName => Services.Count > 0 ? Services[0].ServiceName : "Dịch vụ sửa nhà";
    public int BranchId => ServiceAreaId;
    public string BranchName => ServiceAreaName;
    public string BranchAddress => ServiceAreaName;
    public DateTime? ReceivedAt => OnTheWayAt;
}

public class TechnicianJobFilterRequest
{
    public string? Status { get; set; }
    public string? Search { get; set; }
}

public class TechnicianTravelRequest
{
    public string? Note { get; set; }
}

public class TechnicianReceiveRequest
{
    public string? ReceiveNote { get; set; }
}

public class TechnicianInspectRequest
{
    public string? Diagnosis { get; set; }
    public string? RepairNotes { get; set; }
    public decimal? ActualCost { get; set; }
}

public class TechnicianStartRepairRequest
{
    public string? RepairSolution { get; set; }
    public string? RepairNotes { get; set; }
    public decimal? ActualCost { get; set; }
}

public class TechnicianUpdateRepairRequest
{
    public string? Diagnosis { get; set; }
    public string? RepairSolution { get; set; }
    public string? RepairNotes { get; set; }
    public decimal? ActualCost { get; set; }
    public string? ProgressNote { get; set; }
}

public class TechnicianCompleteRepairRequest
{
    public string? RepairResult { get; set; }
    public string? RepairNotes { get; set; }
    public decimal? ActualCost { get; set; }
}
