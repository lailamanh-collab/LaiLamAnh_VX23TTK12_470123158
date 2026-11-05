using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using HomeRepairBooking.Api.Data;
using HomeRepairBooking.Api.Domain;
using HomeRepairBooking.Api.DTOs;

namespace HomeRepairBooking.Api.Services;

public class ReportService
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _users;

    public ReportService(AppDbContext db, UserManager<ApplicationUser> users)
    {
        _db = db;
        _users = users;
    }

    public async Task<AdminDashboardDto> GetDashboardAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // 1. STATISTIC CARDS
        var bookingsToday = await _db.Bookings.CountAsync(b => b.AppointmentDate == today && b.Status != BookingStatus.Cancelled);
        var pendingBookings = await _db.Bookings.CountAsync(b => b.Status == BookingStatus.Pending);
        var confirmedBookings = await _db.Bookings.CountAsync(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Assigned);
        var repairingBookings = await _db.Bookings.CountAsync(b => b.Status == BookingStatus.Repairing || b.Status == BookingStatus.Inspecting || b.Status == BookingStatus.OnTheWay);
        var completedToday = await _db.Bookings.CountAsync(b => b.Status == BookingStatus.Completed && b.CompletedAt.HasValue && DateOnly.FromDateTime(b.CompletedAt.Value) == today);
        var completedAllTime = await _db.Bookings.CountAsync(b => b.Status == BookingStatus.Completed);
        var totalRepairValue = await _db.Bookings.Where(b => b.Status == BookingStatus.Completed).SumAsync(b => b.ActualCost ?? b.EstimatedTotal);

        var customers = await _users.GetUsersInRoleAsync(AppRoles.Customer);
        var totalCustomers = customers.Count;
        var totalTechnicians = await _db.Technicians.CountAsync(t => t.IsActive);

        var stats = new StatCardsDto(
            bookingsToday,
            pendingBookings,
            confirmedBookings,
            repairingBookings,
            completedToday,
            totalCustomers,
            totalTechnicians,
            totalRepairValue,
            completedAllTime);

        // 2. CHART: BOOKINGS BY DATE (Past 7 days)
        var dateList = new List<ChartDateItem>();
        for (int i = 6; i >= 0; i--)
        {
            var d = today.AddDays(-i);
            var dateStr = d.ToString("yyyy-MM-dd");
            var dayBookings = await _db.Bookings.Where(b => b.AppointmentDate == d && b.Status != BookingStatus.Cancelled).ToListAsync();
            var count = dayBookings.Count;
            var rev = dayBookings.Where(b => b.Status == BookingStatus.Completed).Sum(b => b.ActualCost ?? b.EstimatedTotal);
            dateList.Add(new ChartDateItem(dateStr, count, rev));
        }

        // 3. CHART: BOOKINGS BY STATUS
        var statusLabels = new Dictionary<BookingStatus, string>
        {
            { BookingStatus.Pending, "Chờ xác nhận" },
            { BookingStatus.Confirmed, "Đã xác nhận" },
            { BookingStatus.Assigned, "Đã phân công" },
            { BookingStatus.OnTheWay, "Đang di chuyển" },
            { BookingStatus.Inspecting, "Đang kiểm tra" },
            { BookingStatus.Repairing, "Đang sửa chữa" },
            { BookingStatus.Completed, "Hoàn thành" },
            { BookingStatus.Cancelled, "Đã hủy" }
        };

        var statusGroups = await _db.Bookings
            .GroupBy(b => b.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var statusList = Enum.GetValues<BookingStatus>().Select(s =>
        {
            var matched = statusGroups.FirstOrDefault(g => g.Status == s);
            return new ChartStatusItem(s.ToString(), statusLabels[s], matched?.Count ?? 0);
        }).ToList();

        // 4. CHART: POPULAR SERVICES
        var serviceRaw = await _db.BookingServiceLines
            .Select(s => new { s.ServiceName, s.UnitPrice })
            .ToListAsync();

        var popularServices = serviceRaw
            .GroupBy(s => s.ServiceName)
            .Select(g => new ChartServiceItem(g.Key, g.Count(), g.Sum(x => x.UnitPrice ?? 0)))
            .OrderByDescending(s => s.Count)
            .Take(8)
            .ToList();

        // 5. CHART: POPULAR SERVICE CATEGORIES
        var categoryLines = await _db.BookingServiceLines
            .Include(s => s.RepairService).ThenInclude(r => r.ServiceCategory)
            .Include(s => s.Booking)
            .Where(s => s.Booking.Status != BookingStatus.Cancelled)
            .Select(s => new
            {
                CategoryName = s.RepairService.ServiceCategory.Name,
                s.Booking.Status,
                Revenue = s.UnitPrice ?? 0
            })
            .ToListAsync();

        var popularCategories = categoryLines
            .GroupBy(c => c.CategoryName)
            .Select(g => new ChartCategoryItem(
                g.Key,
                g.Count(),
                g.Where(x => x.Status == BookingStatus.Completed).Sum(x => x.Revenue)))
            .OrderByDescending(c => c.Count)
            .ToList();

        // 6. TOP SPECIFIC SERVICES (Replacing legacy repaired models)
        var topSpecificServices = popularServices.Take(6).Select(s =>
            new ChartModelItem(s.ServiceName, "Sửa chữa", s.Count)).ToList();

        // 7. CHART: BOOKINGS BY SERVICE AREA
        var areasRaw = await _db.Bookings
            .Where(b => b.Status != BookingStatus.Cancelled)
            .Select(b => new
            {
                AreaName = b.ServiceArea.Name,
                b.Status,
                Revenue = b.ActualCost ?? b.EstimatedTotal
            })
            .ToListAsync();

        var bookingsByArea = areasRaw
            .GroupBy(b => b.AreaName)
            .Select(g => new ChartAreaItem(g.Key, g.Count(), g.Where(b => b.Status == BookingStatus.Completed).Sum(b => b.Revenue)))
            .OrderByDescending(b => b.Count)
            .ToList();

        // 8. CHART: REVENUE BY MONTH (Past 6 months)
        var monthsList = new List<ChartMonthItem>();
        var nowUtc = DateTime.UtcNow;
        for (int i = 5; i >= 0; i--)
        {
            var mDate = nowUtc.AddMonths(-i);
            var year = mDate.Year;
            var month = mDate.Month;
            var label = $"{month:00}/{year}";

            var mBookings = await _db.Bookings
                .Where(b => b.CreatedAt.Year == year && b.CreatedAt.Month == month)
                .ToListAsync();

            var count = mBookings.Count;
            var rev = mBookings.Where(b => b.Status == BookingStatus.Completed).Sum(b => b.ActualCost ?? b.EstimatedTotal);
            monthsList.Add(new ChartMonthItem(label, rev, count));
        }

        return new AdminDashboardDto(
            stats,
            dateList,
            statusList,
            popularServices,
            popularCategories,
            topSpecificServices,
            bookingsByArea,
            monthsList);
    }

    public async Task<ReportResultDto> GetReportDataAsync(ReportFilterRequest filter)
    {
        var query = _db.Bookings
            .AsNoTracking()
            .Include(b => b.Customer)
            .Include(b => b.ServiceArea)
            .Include(b => b.Technician).ThenInclude(t => t!.User)
            .Include(b => b.Services).ThenInclude(s => s.RepairService).ThenInclude(r => r.ServiceCategory)
            .Include(b => b.Review)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.FromDate) && DateOnly.TryParse(filter.FromDate, out var fromDate))
        {
            query = query.Where(b => b.AppointmentDate >= fromDate);
        }

        if (!string.IsNullOrWhiteSpace(filter.ToDate) && DateOnly.TryParse(filter.ToDate, out var toDate))
        {
            query = query.Where(b => b.AppointmentDate <= toDate);
        }

        var areaId = filter.ServiceAreaId ?? filter.BranchId;
        if (areaId.HasValue)
        {
            query = query.Where(b => b.ServiceAreaId == areaId.Value);
        }

        if (filter.TechnicianId.HasValue)
        {
            query = query.Where(b => b.TechnicianId == filter.TechnicianId.Value);
        }

        if (filter.RepairServiceId.HasValue)
        {
            query = query.Where(b => b.Services.Any(s => s.RepairServiceId == filter.RepairServiceId.Value));
        }

        var catId = filter.ServiceCategoryId ?? filter.BrandId;
        if (catId.HasValue)
        {
            query = query.Where(b => b.Services.Any(s => s.RepairService.ServiceCategoryId == catId.Value));
        }

        if (!string.IsNullOrWhiteSpace(filter.Status) && Enum.TryParse<BookingStatus>(filter.Status, true, out var status))
        {
            query = query.Where(b => b.Status == status);
        }

        var list = await query.ToListAsync();

        var total = list.Count;
        var completed = list.Count(b => b.Status == BookingStatus.Completed);
        var cancelled = list.Count(b => b.Status == BookingStatus.Cancelled);
        var revenue = list.Where(b => b.Status == BookingStatus.Completed).Sum(b => b.ActualCost ?? b.EstimatedTotal);
        var avgValue = completed > 0 ? revenue / completed : 0;

        var summary = new ReportSummaryDto(total, completed, cancelled, revenue, avgValue);

        // Tech performance
        var techPerf = list
            .Where(b => b.TechnicianId.HasValue)
            .GroupBy(b => new { Id = b.TechnicianId!.Value, Name = b.Technician!.User.FullName, Area = b.ServiceArea.Name })
            .Select(g =>
            {
                var comp = g.Count(b => b.Status == BookingStatus.Completed);
                var rev = g.Where(b => b.Status == BookingStatus.Completed).Sum(b => b.ActualCost ?? b.EstimatedTotal);
                var reviews = g.Where(b => b.Review != null).Select(b => b.Review!.Rating).ToList();
                var avgRating = reviews.Count > 0 ? reviews.Average() : 0.0;
                return new TechnicianPerformanceItem(g.Key.Id, g.Key.Name, g.Key.Area, g.Count(), comp, rev, avgRating, reviews.Count);
            })
            .OrderByDescending(t => t.CompletedJobs)
            .ToList();

        // Area performance
        var areaPerf = list
            .GroupBy(b => new { b.ServiceAreaId, b.ServiceArea.Name })
            .Select(g =>
            {
                var comp = g.Count(b => b.Status == BookingStatus.Completed);
                var rev = g.Where(b => b.Status == BookingStatus.Completed).Sum(b => b.ActualCost ?? b.EstimatedTotal);
                return new AreaPerformanceItem(g.Key.ServiceAreaId, g.Key.Name, g.Count(), comp, rev);
            })
            .OrderByDescending(a => a.Revenue)
            .ToList();

        // Service performance
        var svcLines = list.SelectMany(b => b.Services.Select(s => new
        {
            s.RepairServiceId,
            s.ServiceName,
            s.UnitPrice,
            b.Status
        })).ToList();

        var svcPerf = svcLines
            .GroupBy(s => new { s.RepairServiceId, s.ServiceName })
            .Select(g => new ServicePerformanceItem(
                g.Key.RepairServiceId,
                g.Key.ServiceName,
                g.Count(),
                g.Where(x => x.Status == BookingStatus.Completed).Sum(x => x.UnitPrice ?? 0)))
            .OrderByDescending(s => s.Count)
            .ToList();

        // Category performance
        var catLines = list.SelectMany(b => b.Services.Select(s => new
        {
            CategoryName = s.RepairService?.ServiceCategory?.Name ?? "Sửa chữa chung",
            s.UnitPrice,
            b.Status
        })).ToList();

        var catPerf = catLines
            .GroupBy(c => c.CategoryName)
            .Select(g => new CategoryPerformanceItem(
                g.Key,
                g.Count(),
                g.Where(x => x.Status == BookingStatus.Completed).Sum(x => x.UnitPrice ?? 0)))
            .OrderByDescending(c => c.Count)
            .ToList();

        return new ReportResultDto(summary, techPerf, areaPerf, svcPerf, catPerf);
    }
}
