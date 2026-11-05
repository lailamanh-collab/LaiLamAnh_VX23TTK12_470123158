namespace PhoneRepairBooking.Api.DTOs;

public record StatCardsDto(
    int BookingsToday,
    int PendingBookings,
    int ConfirmedBookings,
    int RepairingBookings,
    int CompletedToday,
    int TotalCustomers,
    int TotalTechnicians,
    decimal TotalRepairValue,
    int CompletedBookingsAllTime);

public record ChartDateItem(string Date, int Count, decimal Revenue);

public record ChartStatusItem(string Status, string StatusLabel, int Count);

public record ChartServiceItem(string ServiceName, int Count, decimal Revenue);

public record ChartCategoryItem(string CategoryName, int Count, decimal Revenue)
{
    // Backward compatibility alias
    public string BrandName => CategoryName;
}

public record ChartBrandItem(string BrandName, int Count, decimal Revenue)
    : ChartCategoryItem(BrandName, Count, Revenue);

public record ChartModelItem(string ModelName, string BrandName, int Count);

public record ChartAreaItem(string AreaName, int Count, decimal Revenue)
{
    public string BranchName => AreaName;
}

public record ChartBranchItem(string BranchName, int Count, decimal Revenue)
    : ChartAreaItem(BranchName, Count, Revenue);

public record ChartMonthItem(string Month, decimal Revenue, int Count);

public record AdminDashboardDto(
    StatCardsDto Stats,
    List<ChartDateItem> BookingsByDate,
    List<ChartStatusItem> BookingsByStatus,
    List<ChartServiceItem> PopularServices,
    List<ChartCategoryItem> PopularCategories,
    List<ChartModelItem> RepairedModels, // Kept empty or with top services for backward compat
    List<ChartAreaItem> BookingsByArea,
    List<ChartMonthItem> RevenueByMonth)
{
    // Backward compatibility aliases
    public List<ChartBrandItem> RepairedBrands => PopularCategories.Select(c => new ChartBrandItem(c.CategoryName, c.Count, c.Revenue)).ToList();
    public List<ChartBranchItem> BookingsByBranch => BookingsByArea.Select(a => new ChartBranchItem(a.AreaName, a.Count, a.Revenue)).ToList();
}

public class ReportFilterRequest
{
    public string? FromDate { get; set; }

    public string? ToDate { get; set; }

    public int? ServiceAreaId { get; set; }

    public int? BranchId { get => ServiceAreaId; set => ServiceAreaId = value; }

    public int? TechnicianId { get; set; }

    public int? RepairServiceId { get; set; }

    public int? ServiceCategoryId { get; set; }

    public int? BrandId { get => ServiceCategoryId; set => ServiceCategoryId = value; }

    public int? PhoneModelId { get; set; }

    public string? Status { get; set; }
}

public record ReportSummaryDto(
    int TotalBookings,
    int CompletedBookings,
    int CancelledBookings,
    decimal TotalRevenue,
    decimal AverageBookingValue);

public record TechnicianPerformanceItem(
    int TechnicianId,
    string TechnicianName,
    string ServiceAreaName,
    int TotalAssigned,
    int CompletedJobs,
    decimal TotalRevenue,
    double AverageRating,
    int TotalReviews)
{
    public string BranchName => ServiceAreaName;
}

public record AreaPerformanceItem(
    int ServiceAreaId,
    string ServiceAreaName,
    int TotalBookings,
    int CompletedBookings,
    decimal Revenue)
{
    public int BranchId => ServiceAreaId;
    public string BranchName => ServiceAreaName;
}

public record BranchPerformanceItem(
    int BranchId,
    string BranchName,
    int TotalBookings,
    int CompletedBookings,
    decimal Revenue)
    : AreaPerformanceItem(BranchId, BranchName, TotalBookings, CompletedBookings, Revenue);

public record ServicePerformanceItem(
    int ServiceId,
    string ServiceName,
    int Count,
    decimal TotalRevenue);

public record CategoryPerformanceItem(
    string CategoryName,
    int Count,
    decimal Revenue)
{
    public string BrandName => CategoryName;
}

public record BrandPerformanceItem(
    string BrandName,
    int Count,
    decimal Revenue)
    : CategoryPerformanceItem(BrandName, Count, Revenue);

public record ReportResultDto(
    ReportSummaryDto Summary,
    List<TechnicianPerformanceItem> TechnicianPerformance,
    List<AreaPerformanceItem> AreaPerformance,
    List<ServicePerformanceItem> ServicePerformance,
    List<CategoryPerformanceItem> CategoryPerformance)
{
    public List<BranchPerformanceItem> BranchPerformance => AreaPerformance.Select(a => new BranchPerformanceItem(a.ServiceAreaId, a.ServiceAreaName, a.TotalBookings, a.CompletedBookings, a.Revenue)).ToList();
    public List<BrandPerformanceItem> BrandPerformance => CategoryPerformance.Select(c => new BrandPerformanceItem(c.CategoryName, c.Count, c.Revenue)).ToList();
}
