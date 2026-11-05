using Microsoft.EntityFrameworkCore;
using HomeRepairBooking.Api.Data;
using HomeRepairBooking.Api.Domain;
using HomeRepairBooking.Api.DTOs;

namespace HomeRepairBooking.Api.Services;

public class TechnicianJobService
{
    private readonly AppDbContext _db;

    public TechnicianJobService(AppDbContext db)
    {
        _db = db;
    }

    private async Task<Technician?> GetTechnicianByUserIdAsync(string userId)
    {
        return await _db.Technicians
            .Include(t => t.ServiceArea)
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.UserId == userId && t.IsActive);
    }

    public async Task<(bool Ok, ApiError? Error, int Status, TechnicianDashboardDto? Data)> GetDashboardAsync(string userId)
    {
        var tech = await GetTechnicianByUserIdAsync(userId);
        if (tech is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy hồ sơ kỹ thuật viên hợp lệ của tài khoản này." }, 403, null);
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var myJobs = _db.Bookings.Where(b => b.TechnicianId == tech.Id);

        var jobsToday = await myJobs.CountAsync(b => b.AppointmentDate == today && b.Status != BookingStatus.Cancelled);
        var confirmedJobs = await myJobs.CountAsync(b => b.Status == BookingStatus.Confirmed);
        var assignedJobs = await myJobs.CountAsync(b => b.Status == BookingStatus.Assigned);
        var onTheWayJobs = await myJobs.CountAsync(b => b.Status == BookingStatus.OnTheWay);
        var inspectingJobs = await myJobs.CountAsync(b => b.Status == BookingStatus.Inspecting);
        var repairingJobs = await myJobs.CountAsync(b => b.Status == BookingStatus.Repairing);
        var completedJobs = await myJobs.CountAsync(b => b.Status == BookingStatus.Completed);
        var completedTodayJobs = await myJobs.CountAsync(b => b.Status == BookingStatus.Completed && b.CompletedAt.HasValue && DateOnly.FromDateTime(b.CompletedAt.Value) == today);
        var totalActive = assignedJobs + onTheWayJobs + inspectingJobs + repairingJobs;

        var data = new TechnicianDashboardDto(
            tech.Id,
            tech.User.FullName,
            tech.ServiceAreaId,
            tech.ServiceArea?.Name ?? string.Empty,
            jobsToday,
            confirmedJobs,
            assignedJobs,
            onTheWayJobs,
            inspectingJobs,
            repairingJobs,
            completedJobs,
            completedTodayJobs,
            totalActive);

        return (true, null, 200, data);
    }

    public async Task<(bool Ok, ApiError? Error, int Status, List<TechnicianJobSummaryDto>? Data)> GetJobsAsync(string userId, TechnicianJobFilterRequest filter)
    {
        var tech = await GetTechnicianByUserIdAsync(userId);
        if (tech is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy hồ sơ kỹ thuật viên hợp lệ của tài khoản này." }, 403, null);
        }

        var query = _db.Bookings
            .AsNoTracking()
            .Include(b => b.Customer)
            .Include(b => b.ServiceArea)
            .Include(b => b.Services).ThenInclude(s => s.RepairService).ThenInclude(r => r.ServiceCategory)
            .Where(b => b.TechnicianId == tech.Id);

        var statusKey = filter.Status?.Trim();
        var isCompletedTab = false;

        if (!string.IsNullOrWhiteSpace(statusKey))
        {
            if (statusKey.Equals("Today", StringComparison.OrdinalIgnoreCase))
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                query = query.Where(b => b.AppointmentDate == today && b.Status != BookingStatus.Cancelled);
            }
            else if (statusKey.Equals("Assigned", StringComparison.OrdinalIgnoreCase) || statusKey.Equals("NeedReceive", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(b => b.Status == BookingStatus.Assigned || b.Status == BookingStatus.Confirmed);
            }
            else if (statusKey.Equals("OnTheWay", StringComparison.OrdinalIgnoreCase) || statusKey.Equals("Received", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(b => b.Status == BookingStatus.OnTheWay);
            }
            else if (statusKey.Equals("Inspecting", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(b => b.Status == BookingStatus.Inspecting);
            }
            else if (statusKey.Equals("Repairing", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(b => b.Status == BookingStatus.Repairing);
            }
            else if (statusKey.Equals("Completed", StringComparison.OrdinalIgnoreCase))
            {
                isCompletedTab = true;
                query = query.Where(b => b.Status == BookingStatus.Completed);
            }
            else if (statusKey.Equals("Active", StringComparison.OrdinalIgnoreCase) || statusKey.Equals("InProgress", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(b => b.Status == BookingStatus.Assigned || b.Status == BookingStatus.OnTheWay || b.Status == BookingStatus.Inspecting || b.Status == BookingStatus.Repairing);
            }
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var q = filter.Search.Trim().ToLower();
            query = query.Where(b =>
                b.BookingCode.ToLower().Contains(q) ||
                b.CustomerName.ToLower().Contains(q) ||
                b.CustomerPhone.ToLower().Contains(q) ||
                b.AddressLine.ToLower().Contains(q) ||
                (b.District != null && b.District.ToLower().Contains(q)) ||
                b.Services.Any(s => s.ServiceName.ToLower().Contains(q)));
        }

        IOrderedQueryable<Booking> ordered;
        if (isCompletedTab)
        {
            ordered = query.OrderByDescending(b => b.CompletedAt ?? b.CreatedAt);
        }
        else
        {
            ordered = query.OrderBy(b => b.Status == BookingStatus.Completed ? 1 : 0)
                .ThenBy(b => b.AppointmentDate)
                .ThenBy(b => b.SlotStart);
        }

        var rows = await ordered.ToListAsync();
        var list = rows.Select(ToSummaryDto).ToList();
        return (true, null, 200, list);
    }

    public async Task<(bool Ok, ApiError? Error, int Status, TechnicianJobDetailDto? Data)> GetJobDetailAsync(string userId, int id)
    {
        var tech = await GetTechnicianByUserIdAsync(userId);
        if (tech is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy hồ sơ kỹ thuật viên hợp lệ của tài khoản này." }, 403, null);
        }

        var booking = await DetailQuery().FirstOrDefaultAsync(b => b.Id == id);
        if (booking is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy thông tin ca sửa chữa này." }, 404, null);
        }

        if (booking.TechnicianId != tech.Id)
        {
            return (false, new ApiError { Message = "Bạn chỉ có thể xem và xử lý các ca sửa chữa được phân công cho mình." }, 403, null);
        }

        return (true, null, 200, ToDetailDto(booking));
    }

    // STEP 1: ON THE WAY (Thợ bắt đầu di chuyển đến nhà khách)
    public async Task<(bool Ok, ApiError? Error, int Status, TechnicianJobDetailDto? Data)> StartTravelAsync(string userId, int id, TechnicianTravelRequest request)
    {
        var tech = await GetTechnicianByUserIdAsync(userId);
        if (tech is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy hồ sơ kỹ thuật viên hợp lệ." }, 403, null);
        }

        var booking = await DetailQuery().FirstOrDefaultAsync(b => b.Id == id);
        if (booking is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy ca sửa chữa." }, 404, null);
        }

        if (booking.TechnicianId != tech.Id)
        {
            return (false, new ApiError { Message = "Bạn không có quyền thao tác trên ca sửa chữa này." }, 403, null);
        }

        if (booking.Status != BookingStatus.Assigned && booking.Status != BookingStatus.Confirmed)
        {
            return (false, new ApiError { Message = $"Chỉ có thể chuyển sang Đang di chuyển từ trạng thái Đã phân công/Đã xác nhận. Trạng thái hiện tại: {booking.Status}." }, 400, null);
        }

        var now = DateTime.UtcNow;
        var prevStatus = booking.Status;
        booking.Status = BookingStatus.OnTheWay;
        booking.OnTheWayAt = now;

        var note = !string.IsNullOrWhiteSpace(request.Note)
            ? request.Note.Trim()
            : "Kỹ thuật viên đang di chuyển đến địa chỉ nhà khách hàng.";

        booking.StatusHistory.Add(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = prevStatus,
            ToStatus = BookingStatus.OnTheWay,
            ChangedAt = now,
            ChangedByUserId = userId,
            Note = note
        });

        await _db.SaveChangesAsync();
        return (true, null, 200, ToDetailDto(booking));
    }

    // Backward-compat alias for ReceiveJobAsync
    public Task<(bool Ok, ApiError? Error, int Status, TechnicianJobDetailDto? Data)> ReceiveJobAsync(string userId, int id, TechnicianReceiveRequest request) =>
        StartTravelAsync(userId, id, new TechnicianTravelRequest { Note = request.ReceiveNote });

    // STEP 2: INSPECTING (Thợ đã đến nhà & bắt đầu kiểm tra / khảo sát)
    public async Task<(bool Ok, ApiError? Error, int Status, TechnicianJobDetailDto? Data)> StartInspectionAsync(string userId, int id, TechnicianInspectRequest request)
    {
        var tech = await GetTechnicianByUserIdAsync(userId);
        if (tech is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy hồ sơ kỹ thuật viên hợp lệ." }, 403, null);
        }

        var booking = await DetailQuery().FirstOrDefaultAsync(b => b.Id == id);
        if (booking is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy ca sửa chữa." }, 404, null);
        }

        if (booking.TechnicianId != tech.Id)
        {
            return (false, new ApiError { Message = "Bạn không có quyền thao tác trên ca sửa chữa này." }, 403, null);
        }

        if (booking.Status != BookingStatus.OnTheWay && booking.Status != BookingStatus.Assigned)
        {
            return (false, new ApiError { Message = $"Chỉ có thể bắt đầu kiểm tra khi đang di chuyển hoặc đã phân công. Trạng thái hiện tại: {booking.Status}." }, 400, null);
        }

        var now = DateTime.UtcNow;
        var prevStatus = booking.Status;
        booking.Status = BookingStatus.Inspecting;
        booking.InspectionStartedAt = now;

        if (!string.IsNullOrWhiteSpace(request.Diagnosis))
        {
            booking.Diagnosis = request.Diagnosis.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.RepairNotes))
        {
            booking.RepairNotes = request.RepairNotes.Trim();
        }

        if (request.ActualCost.HasValue && request.ActualCost.Value >= 0)
        {
            booking.ActualCost = request.ActualCost.Value;
        }

        var note = "Kỹ thuật viên đã đến nơi và bắt đầu kiểm tra, khảo sát sự cố tại nhà.";
        if (!string.IsNullOrWhiteSpace(booking.Diagnosis))
        {
            note += $" Chẩn đoán: {booking.Diagnosis}";
        }

        booking.StatusHistory.Add(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = prevStatus,
            ToStatus = BookingStatus.Inspecting,
            ChangedAt = now,
            ChangedByUserId = userId,
            Note = note
        });

        await _db.SaveChangesAsync();
        return (true, null, 200, ToDetailDto(booking));
    }

    // STEP 3: REPAIRING (Thợ bắt đầu sửa chữa)
    public async Task<(bool Ok, ApiError? Error, int Status, TechnicianJobDetailDto? Data)> StartRepairAsync(string userId, int id, TechnicianStartRepairRequest request)
    {
        var tech = await GetTechnicianByUserIdAsync(userId);
        if (tech is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy hồ sơ kỹ thuật viên hợp lệ." }, 403, null);
        }

        var booking = await DetailQuery().FirstOrDefaultAsync(b => b.Id == id);
        if (booking is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy ca sửa chữa." }, 404, null);
        }

        if (booking.TechnicianId != tech.Id)
        {
            return (false, new ApiError { Message = "Bạn không có quyền thao tác trên ca sửa chữa này." }, 403, null);
        }

        if (booking.Status != BookingStatus.Inspecting)
        {
            return (false, new ApiError { Message = $"Chỉ có thể bắt đầu sửa chữa sau khi đã kiểm tra (Inspecting). Trạng thái hiện tại: {booking.Status}." }, 400, null);
        }

        var now = DateTime.UtcNow;
        var prevStatus = booking.Status;
        booking.Status = BookingStatus.Repairing;
        booking.RepairStartedAt = now;

        if (!string.IsNullOrWhiteSpace(request.RepairSolution))
        {
            booking.RepairSolution = request.RepairSolution.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.RepairNotes))
        {
            booking.RepairNotes = request.RepairNotes.Trim();
        }

        if (request.ActualCost.HasValue && request.ActualCost.Value >= 0)
        {
            booking.ActualCost = request.ActualCost.Value;
        }

        var note = "Kỹ thuật viên bắt đầu tiến hành sửa chữa tại nhà.";
        if (!string.IsNullOrWhiteSpace(booking.RepairSolution))
        {
            note += $" Phương án: {booking.RepairSolution}";
        }

        booking.StatusHistory.Add(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = prevStatus,
            ToStatus = BookingStatus.Repairing,
            ChangedAt = now,
            ChangedByUserId = userId,
            Note = note
        });

        await _db.SaveChangesAsync();
        return (true, null, 200, ToDetailDto(booking));
    }

    // UPDATE IN-PROGRESS INFO
    public async Task<(bool Ok, ApiError? Error, int Status, TechnicianJobDetailDto? Data)> UpdateRepairProgressAsync(string userId, int id, TechnicianUpdateRepairRequest request)
    {
        var tech = await GetTechnicianByUserIdAsync(userId);
        if (tech is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy hồ sơ kỹ thuật viên hợp lệ." }, 403, null);
        }

        var booking = await DetailQuery().FirstOrDefaultAsync(b => b.Id == id);
        if (booking is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy ca sửa chữa." }, 404, null);
        }

        if (booking.TechnicianId != tech.Id)
        {
            return (false, new ApiError { Message = "Bạn không có quyền thao tác trên ca sửa chữa này." }, 403, null);
        }

        if (booking.Status != BookingStatus.Inspecting && booking.Status != BookingStatus.Repairing)
        {
            return (false, new ApiError { Message = $"Chỉ có thể cập nhật thông tin khi ca sửa đang trong quá trình kiểm tra hoặc sửa chữa. Trạng thái hiện tại: {booking.Status}." }, 400, null);
        }

        if (!string.IsNullOrWhiteSpace(request.Diagnosis))
        {
            booking.Diagnosis = request.Diagnosis.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.RepairSolution))
        {
            booking.RepairSolution = request.RepairSolution.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.RepairNotes))
        {
            booking.RepairNotes = request.RepairNotes.Trim();
        }

        if (request.ActualCost.HasValue && request.ActualCost.Value >= 0)
        {
            booking.ActualCost = request.ActualCost.Value;
        }

        var progressText = !string.IsNullOrWhiteSpace(request.ProgressNote)
            ? request.ProgressNote.Trim()
            : "Kỹ thuật viên cập nhật tiến độ công việc tại nhà.";

        booking.StatusHistory.Add(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = booking.Status,
            ToStatus = booking.Status,
            ChangedAt = DateTime.UtcNow,
            ChangedByUserId = userId,
            Note = progressText
        });

        await _db.SaveChangesAsync();
        return (true, null, 200, ToDetailDto(booking));
    }

    // STEP 4: COMPLETED (Hoàn thành sửa chữa & nghiệm thu)
    public async Task<(bool Ok, ApiError? Error, int Status, TechnicianJobDetailDto? Data)> CompleteRepairAsync(string userId, int id, TechnicianCompleteRepairRequest request)
    {
        var tech = await GetTechnicianByUserIdAsync(userId);
        if (tech is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy hồ sơ kỹ thuật viên hợp lệ." }, 403, null);
        }

        var booking = await DetailQuery().FirstOrDefaultAsync(b => b.Id == id);
        if (booking is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy ca sửa chữa." }, 404, null);
        }

        if (booking.TechnicianId != tech.Id)
        {
            return (false, new ApiError { Message = "Bạn không có quyền thao tác trên ca sửa chữa này." }, 403, null);
        }

        if (booking.Status != BookingStatus.Repairing && booking.Status != BookingStatus.Inspecting)
        {
            return (false, new ApiError { Message = $"Chỉ có thể hoàn thành ca sửa từ trạng thái Đang sửa chữa (Repairing) hoặc Đang kiểm tra (Inspecting). Trạng thái hiện tại: {booking.Status}." }, 400, null);
        }

        var now = DateTime.UtcNow;
        var prevStatus = booking.Status;
        booking.Status = BookingStatus.Completed;
        booking.CompletedAt = now;

        if (request.ActualCost.HasValue && request.ActualCost.Value >= 0)
        {
            booking.ActualCost = request.ActualCost.Value;
        }
        else if (!booking.ActualCost.HasValue)
        {
            booking.ActualCost = booking.EstimatedTotal;
        }

        if (!string.IsNullOrWhiteSpace(request.RepairResult))
        {
            booking.RepairSolution = string.IsNullOrWhiteSpace(booking.RepairSolution)
                ? request.RepairResult.Trim()
                : $"{booking.RepairSolution} | Kết quả: {request.RepairResult.Trim()}";
        }

        if (!string.IsNullOrWhiteSpace(request.RepairNotes))
        {
            booking.RepairNotes = request.RepairNotes.Trim();
        }

        var note = $"Kỹ thuật viên hoàn thành sửa chữa tại nhà. Tổng chi phí: {booking.ActualCost:N0} VNĐ.";
        booking.StatusHistory.Add(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = prevStatus,
            ToStatus = BookingStatus.Completed,
            ChangedAt = now,
            ChangedByUserId = userId,
            Note = note
        });

        await _db.SaveChangesAsync();
        return (true, null, 200, ToDetailDto(booking));
    }

    private IQueryable<Booking> DetailQuery() => _db.Bookings
        .Include(b => b.Customer)
        .Include(b => b.ServiceArea)
        .Include(b => b.Technician).ThenInclude(t => t!.User)
        .Include(b => b.Services).ThenInclude(s => s.RepairService).ThenInclude(r => r.ServiceCategory)
        .Include(b => b.StatusHistory);

    private static string BuildFullAddress(Booking b)
    {
        var parts = new List<string> { b.AddressLine };
        if (!string.IsNullOrWhiteSpace(b.Ward)) parts.Add(b.Ward);
        if (!string.IsNullOrWhiteSpace(b.District)) parts.Add(b.District);
        if (!string.IsNullOrWhiteSpace(b.City)) parts.Add(b.City);
        return string.Join(", ", parts);
    }

    private static TechnicianJobSummaryDto ToSummaryDto(Booking b)
    {
        var firstCat = b.Services.FirstOrDefault()?.RepairService?.ServiceCategory?.Name ?? "Sửa chữa nhà cửa";
        var primarySvc = b.Services.Count > 0 ? string.Join(", ", b.Services.Select(s => s.ServiceName)) : "Dịch vụ sửa chữa";
        var fullAddr = BuildFullAddress(b);

        return new(
            b.Id,
            b.BookingCode,
            b.CustomerName,
            b.CustomerPhone,
            fullAddr,
            firstCat,
            primarySvc,
            b.ServiceArea?.Name ?? string.Empty,
            b.AppointmentDate,
            b.SlotStart.ToString("HH:mm"),
            b.SlotEnd.ToString("HH:mm"),
            b.Status,
            b.ProblemDescription,
            b.EstimatedTotal,
            b.ActualCost,
            DateTime.SpecifyKind(b.CreatedAt, DateTimeKind.Utc),
            b.OnTheWayAt.HasValue ? DateTime.SpecifyKind(b.OnTheWayAt.Value, DateTimeKind.Utc) : null,
            b.InspectionStartedAt.HasValue ? DateTime.SpecifyKind(b.InspectionStartedAt.Value, DateTimeKind.Utc) : null,
            b.RepairStartedAt.HasValue ? DateTime.SpecifyKind(b.RepairStartedAt.Value, DateTimeKind.Utc) : null,
            b.CompletedAt.HasValue ? DateTime.SpecifyKind(b.CompletedAt.Value, DateTimeKind.Utc) : null);
    }

    private static TechnicianJobDetailDto ToDetailDto(Booking b)
    {
        var firstCat = b.Services.FirstOrDefault()?.RepairService?.ServiceCategory?.Name ?? "Sửa chữa nhà cửa";
        var fullAddr = BuildFullAddress(b);

        return new(
            b.Id,
            b.BookingCode,
            b.CustomerId,
            b.CustomerName,
            b.Customer?.Email ?? string.Empty,
            b.CustomerPhone,
            fullAddr,
            b.AddressLine,
            b.Ward,
            b.District,
            b.City,
            firstCat,
            b.ServiceAreaId,
            b.ServiceArea?.Name ?? string.Empty,
            b.ServiceArea?.Phone ?? string.Empty,
            b.AppointmentDate,
            b.SlotStart.ToString("HH:mm"),
            b.SlotEnd.ToString("HH:mm"),
            b.Status,
            b.ProblemDescription,
            b.EstimatedTotal,
            b.ActualCost,
            b.Diagnosis,
            b.RepairNotes,
            b.RepairSolution,
            DateTime.SpecifyKind(b.CreatedAt, DateTimeKind.Utc),
            b.OnTheWayAt.HasValue ? DateTime.SpecifyKind(b.OnTheWayAt.Value, DateTimeKind.Utc) : null,
            b.InspectionStartedAt.HasValue ? DateTime.SpecifyKind(b.InspectionStartedAt.Value, DateTimeKind.Utc) : null,
            b.RepairStartedAt.HasValue ? DateTime.SpecifyKind(b.RepairStartedAt.Value, DateTimeKind.Utc) : null,
            b.CompletedAt.HasValue ? DateTime.SpecifyKind(b.CompletedAt.Value, DateTimeKind.Utc) : null,
            b.Services.Select(s => new BookingLineDto(s.RepairServiceId, s.ServiceName, s.PricingType, s.UnitPrice)).ToList(),
            b.StatusHistory.OrderBy(h => h.ChangedAt).Select(h => new BookingHistoryDto(h.FromStatus, h.ToStatus, h.Note, DateTime.SpecifyKind(h.ChangedAt, DateTimeKind.Utc))).ToList());
    }
}
