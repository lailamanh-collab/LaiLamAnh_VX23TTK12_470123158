using System.Data;
using Microsoft.EntityFrameworkCore;
using PhoneRepairBooking.Api.Data;
using PhoneRepairBooking.Api.Domain;
using PhoneRepairBooking.Api.DTOs;

namespace PhoneRepairBooking.Api.Services;

public class BookingService
{
    private readonly AppDbContext _db;

    public BookingService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<SlotDto>> GetSlotsAsync(int serviceAreaId, DateOnly date)
    {
        var area = await _db.ServiceAreas.AsNoTracking().Include(item => item.OpeningHours)
            .FirstOrDefaultAsync(item => item.Id == serviceAreaId && item.IsActive);
        if (area is null)
        {
            return [];
        }

        var hours = area.OpeningHours.FirstOrDefault(item => item.DayOfWeek == date.DayOfWeek && item.IsOpen);
        if (hours is null)
        {
            return [];
        }

        var booked = await _db.Bookings.AsNoTracking()
            .Where(item => item.ServiceAreaId == serviceAreaId && item.AppointmentDate == date && item.Status != BookingStatus.Cancelled)
            .GroupBy(item => item.SlotStart)
            .Select(group => new { Start = group.Key, Count = group.Count() })
            .ToListAsync();

        var slots = new List<SlotDto>();
        var cursor = hours.OpenTime;
        var now = DateTime.Now;
        while (cursor.AddMinutes(area.SlotMinutes) <= hours.CloseTime)
        {
            var end = cursor.AddMinutes(area.SlotMinutes);
            var slotMoment = date.ToDateTime(cursor);
            if (slotMoment > now)
            {
                var count = booked.FirstOrDefault(item => item.Start == cursor)?.Count ?? 0;
                slots.Add(new SlotDto(cursor.ToString("HH:mm"), end.ToString("HH:mm"), area.CapacityPerSlot, count, count >= area.CapacityPerSlot));
            }

            cursor = end;
        }

        return slots;
    }

    public async Task<(BookingDetailDto? Data, ApiError? Error, int Status)> CreateAsync(string customerId, CreateBookingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ProblemDescription))
        {
            return (null, new ApiError { Message = "Vui lòng nhập mô tả sự cố cần sửa chữa." }, StatusCodes.Status400BadRequest);
        }

        if (string.IsNullOrWhiteSpace(request.CustomerName))
        {
            return (null, new ApiError { Message = "Vui lòng nhập họ tên người liên hệ tại địa chỉ sửa chữa." }, StatusCodes.Status400BadRequest);
        }

        if (string.IsNullOrWhiteSpace(request.CustomerPhone))
        {
            return (null, new ApiError { Message = "Vui lòng nhập số điện thoại liên hệ." }, StatusCodes.Status400BadRequest);
        }

        if (string.IsNullOrWhiteSpace(request.AddressLine))
        {
            return (null, new ApiError { Message = "Vui lòng nhập địa chỉ cụ thể cần thợ đến sửa chữa." }, StatusCodes.Status400BadRequest);
        }

        if (!DateOnly.TryParse(request.AppointmentDate, out var date) || !TimeOnly.TryParse(request.SlotStart, out var slotStart))
        {
            return (null, new ApiError { Message = "Ngày hoặc khung giờ hẹn không hợp lệ." }, StatusCodes.Status400BadRequest);
        }

        if (request.RepairServiceIds.Distinct().Count() != request.RepairServiceIds.Count || request.RepairServiceIds.Count == 0)
        {
            return (null, new ApiError { Message = "Vui lòng chọn ít nhất một dịch vụ sửa chữa." }, StatusCodes.Status400BadRequest);
        }

        var services = await _db.RepairServices.Include(item => item.ServiceCategory)
            .Where(item => request.RepairServiceIds.Contains(item.Id) && item.IsActive && item.ServiceCategory.IsActive)
            .ToListAsync();

        if (services.Count != request.RepairServiceIds.Count)
        {
            return (null, new ApiError { Message = "Một số dịch vụ đã chọn hiện không khả dụng." }, StatusCodes.Status400BadRequest);
        }

        var area = await _db.ServiceAreas.Include(item => item.OpeningHours)
            .FirstOrDefaultAsync(item => item.Id == request.ServiceAreaId && item.IsActive);
        if (area is null)
        {
            return (null, new ApiError { Message = "Khu vực phục vụ được chọn hiện không khả dụng." }, StatusCodes.Status400BadRequest);
        }

        var hours = area.OpeningHours.FirstOrDefault(item => item.DayOfWeek == date.DayOfWeek && item.IsOpen);
        var slotEnd = slotStart.AddMinutes(area.SlotMinutes);
        var minutesFromOpen = hours is null ? 0 : (int)Math.Round((slotStart - hours.OpenTime).TotalMinutes);
        var matchesGrid = hours is not null && slotStart >= hours.OpenTime && slotEnd <= hours.CloseTime
            && minutesFromOpen % area.SlotMinutes == 0;
        if (!matchesGrid || date.ToDateTime(slotStart) <= DateTime.Now)
        {
            return (null, new ApiError { Message = "Khung giờ này không còn khả dụng." }, StatusCodes.Status400BadRequest);
        }

        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var booked = await _db.Bookings.CountAsync(item =>
            item.ServiceAreaId == area.Id &&
            item.AppointmentDate == date &&
            item.SlotStart == slotStart &&
            item.Status != BookingStatus.Cancelled);

        if (booked >= area.CapacityPerSlot)
        {
            return (null, new ApiError { Message = "Khung giờ đã đầy lịch phục vụ. Vui lòng chọn khung giờ khác." }, StatusCodes.Status409Conflict);
        }

        var prefix = $"HRS-{date:yyyyMMdd}-";
        var sequence = await _db.Bookings.CountAsync(item => item.BookingCode.StartsWith(prefix)) + 1;
        var code = $"{prefix}{sequence:000}";
        while (await _db.Bookings.AnyAsync(item => item.BookingCode == code))
        {
            sequence++;
            code = $"{prefix}{sequence:000}";
        }

        var estimated = services.Where(item => item.PricingType == PricingType.FixedPrice).Sum(item => item.BasePrice ?? 0);

        var booking = new Booking
        {
            BookingCode = code,
            CustomerId = customerId,
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            AddressLine = request.AddressLine.Trim(),
            Ward = string.IsNullOrWhiteSpace(request.Ward) ? null : request.Ward.Trim(),
            District = string.IsNullOrWhiteSpace(request.District) ? null : request.District.Trim(),
            City = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim(),
            ServiceAreaId = area.Id,
            ServiceArea = area,
            AppointmentDate = date,
            SlotStart = slotStart,
            SlotEnd = slotEnd,
            Status = BookingStatus.Pending,
            ProblemDescription = request.ProblemDescription.Trim(),
            EstimatedTotal = estimated,
            CreatedAt = DateTime.UtcNow,
            Services = services.Select(item => new BookingServiceLine
            {
                RepairServiceId = item.Id,
                RepairService = item,
                ServiceName = item.Name,
                PricingType = item.PricingType,
                UnitPrice = item.PricingType == PricingType.FixedPrice ? item.BasePrice : null
            }).ToList(),
            StatusHistory =
            [
                new BookingStatusHistory
                {
                    ToStatus = BookingStatus.Pending,
                    Note = "Khách hàng gửi yêu cầu đặt lịch sửa chữa tại nhà.",
                    ChangedByUserId = customerId,
                    ChangedAt = DateTime.UtcNow
                }
            ]
        };

        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return (ToDetail(booking), null, StatusCodes.Status201Created);
    }

    public async Task<List<BookingSummaryDto>> GetMineAsync(string customerId, string? filter)
    {
        var query = OwnBookings().Where(item => item.CustomerId == customerId);
        query = ApplyFilter(query, filter);
        var rows = await query.OrderByDescending(item => item.CreatedAt).ToListAsync();
        return rows.Select(ToSummary).ToList();
    }

    public async Task<BookingDetailDto?> GetMineDetailAsync(string customerId, int id)
    {
        var booking = await OwnBookings().FirstOrDefaultAsync(item => item.Id == id && item.CustomerId == customerId);
        return booking is null ? null : ToDetail(booking);
    }

    public async Task<(bool Ok, ApiError? Error, int Status)> CancelMineAsync(string customerId, int id, string? reason)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(item => item.Id == id && item.CustomerId == customerId);
        if (booking is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy lịch hẹn." }, StatusCodes.Status404NotFound);
        }

        var appointment = booking.AppointmentDate.ToDateTime(booking.SlotStart);
        var allowed = booking.Status == BookingStatus.Pending || (booking.Status == BookingStatus.Confirmed && appointment > DateTime.Now);
        if (!allowed)
        {
            return (false, new ApiError { Message = "Lịch hẹn ở trạng thái này không thể tự hủy." }, StatusCodes.Status400BadRequest);
        }

        var from = booking.Status;
        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;
        booking.CancelReason = string.IsNullOrWhiteSpace(reason) ? "Khách hủy lịch" : reason.Trim();
        _db.BookingStatusHistories.Add(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = from,
            ToStatus = BookingStatus.Cancelled,
            Note = booking.CancelReason,
            ChangedByUserId = customerId,
            ChangedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return (true, null, StatusCodes.Status204NoContent);
    }

    private IQueryable<Booking> OwnBookings() => _db.Bookings.AsNoTracking()
        .Include(item => item.ServiceArea)
        .Include(item => item.Technician)!.ThenInclude(item => item!.User)
        .Include(item => item.Services).ThenInclude(s => s.RepairService).ThenInclude(r => r.ServiceCategory)
        .Include(item => item.StatusHistory)
        .Include(item => item.Review);

    private static IQueryable<Booking> ApplyFilter(IQueryable<Booking> query, string? filter) => filter?.ToLowerInvariant() switch
    {
        "pending" => query.Where(item => item.Status == BookingStatus.Pending),
        "inprogress" => query.Where(item => item.Status == BookingStatus.Confirmed || item.Status == BookingStatus.Assigned || item.Status == BookingStatus.OnTheWay || item.Status == BookingStatus.Inspecting || item.Status == BookingStatus.Repairing),
        "completed" => query.Where(item => item.Status == BookingStatus.Completed),
        "cancelled" => query.Where(item => item.Status == BookingStatus.Cancelled),
        _ => query
    };

    private static string BuildFullAddress(Booking b)
    {
        var parts = new List<string> { b.AddressLine };
        if (!string.IsNullOrWhiteSpace(b.Ward)) parts.Add(b.Ward);
        if (!string.IsNullOrWhiteSpace(b.District)) parts.Add(b.District);
        if (!string.IsNullOrWhiteSpace(b.City)) parts.Add(b.City);
        return string.Join(", ", parts);
    }

    private static BookingSummaryDto ToSummary(Booking booking)
    {
        var firstCat = booking.Services.FirstOrDefault()?.RepairService?.ServiceCategory?.Name ?? "Sửa chữa nhà cửa";
        var primarySvc = booking.Services.Count > 0 ? string.Join(", ", booking.Services.Select(s => s.ServiceName)) : "Dịch vụ sửa chữa";
        var fullAddr = BuildFullAddress(booking);

        return new(
            booking.Id,
            booking.BookingCode,
            booking.CustomerName,
            booking.CustomerPhone,
            firstCat,
            primarySvc,
            booking.ServiceArea?.Name ?? string.Empty,
            fullAddr,
            booking.AppointmentDate,
            booking.SlotStart.ToString("HH:mm"),
            booking.Status,
            booking.EstimatedTotal,
            booking.ActualCost,
            booking.Technician?.User.FullName,
            DateTime.SpecifyKind(booking.CreatedAt, DateTimeKind.Utc),
            booking.Review != null);
    }

    private static BookingDetailDto ToDetail(Booking booking)
    {
        var firstCat = booking.Services.FirstOrDefault()?.RepairService?.ServiceCategory?.Name ?? "Sửa chữa nhà cửa";
        var fullAddr = BuildFullAddress(booking);

        return new(
            booking.Id,
            booking.BookingCode,
            booking.CustomerName,
            booking.CustomerPhone,
            booking.AddressLine,
            booking.Ward,
            booking.District,
            booking.City,
            fullAddr,
            firstCat,
            booking.ServiceArea?.Name ?? string.Empty,
            booking.ServiceArea?.Phone ?? string.Empty,
            booking.AppointmentDate,
            booking.SlotStart.ToString("HH:mm"),
            booking.SlotEnd.ToString("HH:mm"),
            booking.Status,
            booking.ProblemDescription,
            booking.EstimatedTotal,
            booking.ActualCost,
            booking.Technician?.User.FullName,
            booking.Technician?.User.PhoneNumber,
            booking.Diagnosis,
            booking.RepairNotes,
            booking.RepairSolution,
            booking.OnTheWayAt.HasValue ? DateTime.SpecifyKind(booking.OnTheWayAt.Value, DateTimeKind.Utc) : null,
            booking.InspectionStartedAt.HasValue ? DateTime.SpecifyKind(booking.InspectionStartedAt.Value, DateTimeKind.Utc) : null,
            booking.RepairStartedAt.HasValue ? DateTime.SpecifyKind(booking.RepairStartedAt.Value, DateTimeKind.Utc) : null,
            booking.CompletedAt.HasValue ? DateTime.SpecifyKind(booking.CompletedAt.Value, DateTimeKind.Utc) : null,
            DateTime.SpecifyKind(booking.CreatedAt, DateTimeKind.Utc),
            booking.Services.Select(item => new BookingLineDto(item.RepairServiceId, item.ServiceName, item.PricingType, item.UnitPrice)).ToList(),
            booking.StatusHistory.OrderBy(item => item.ChangedAt).Select(item => new BookingHistoryDto(item.FromStatus, item.ToStatus, item.Note, DateTime.SpecifyKind(item.ChangedAt, DateTimeKind.Utc))).ToList(),
            booking.Review != null ? ReviewService.ToDto(booking.Review, booking) : null);
    }
}
