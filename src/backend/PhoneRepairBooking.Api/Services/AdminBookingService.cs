using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PhoneRepairBooking.Api.Data;
using PhoneRepairBooking.Api.Domain;
using PhoneRepairBooking.Api.DTOs;

namespace PhoneRepairBooking.Api.Services;

public class AdminBookingService
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _users;

    public AdminBookingService(AppDbContext db, UserManager<ApplicationUser> users)
    {
        _db = db;
        _users = users;
    }

    public async Task<List<AdminBookingDto>> GetBookingsAsync(AdminBookingFilterRequest request)
    {
        var query = AdminQuery();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var q = request.Search.Trim().ToLower();
            query = query.Where(item =>
                item.BookingCode.ToLower().Contains(q) ||
                item.CustomerName.ToLower().Contains(q) ||
                item.CustomerPhone.ToLower().Contains(q) ||
                item.AddressLine.ToLower().Contains(q) ||
                (item.District != null && item.District.ToLower().Contains(q)) ||
                (item.Customer.Email != null && item.Customer.Email.ToLower().Contains(q)) ||
                item.ServiceArea.Name.ToLower().Contains(q) ||
                (item.Technician != null && item.Technician.User.FullName.ToLower().Contains(q)) ||
                item.Services.Any(s => s.ServiceName.ToLower().Contains(q)));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<BookingStatus>(request.Status, true, out var parsedStatus))
        {
            query = query.Where(item => item.Status == parsedStatus);
        }

        var areaId = request.ServiceAreaId ?? request.BranchId;
        if (areaId.HasValue)
        {
            query = query.Where(item => item.ServiceAreaId == areaId.Value);
        }

        if (request.TechnicianId.HasValue)
        {
            query = query.Where(item => item.TechnicianId == request.TechnicianId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Date) && DateOnly.TryParse(request.Date, out var date))
        {
            query = query.Where(item => item.AppointmentDate == date);
        }

        if (!string.IsNullOrWhiteSpace(request.FromDate) && DateOnly.TryParse(request.FromDate, out var fromDate))
        {
            query = query.Where(item => item.AppointmentDate >= fromDate);
        }

        if (!string.IsNullOrWhiteSpace(request.ToDate) && DateOnly.TryParse(request.ToDate, out var toDate))
        {
            query = query.Where(item => item.AppointmentDate <= toDate);
        }

        var rows = await query.OrderByDescending(item => item.CreatedAt).ToListAsync();
        return rows.Select(ToAdminDto).ToList();
    }

    public async Task<AdminBookingDto?> GetBookingDetailAsync(int id)
    {
        var booking = await AdminQuery().FirstOrDefaultAsync(item => item.Id == id);
        return booking is null ? null : ToAdminDto(booking);
    }

    public async Task<(bool Ok, ApiError? Error, int Status)> ConfirmBookingAsync(int id, string adminUserId, string? note)
    {
        var booking = await _db.Bookings
            .Include(item => item.StatusHistory)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (booking is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy lịch hẹn." }, StatusCodes.Status404NotFound);
        }

        if (booking.Status != BookingStatus.Pending)
        {
            return (false, new ApiError { Message = $"Không thể xác nhận lịch hẹn đang ở trạng thái {booking.Status}." }, StatusCodes.Status400BadRequest);
        }

        var from = booking.Status;
        booking.Status = BookingStatus.Confirmed;
        _db.BookingStatusHistories.Add(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = from,
            ToStatus = BookingStatus.Confirmed,
            Note = string.IsNullOrWhiteSpace(note) ? "Admin xác nhận lịch đặt dịch vụ sửa chữa tại nhà." : note.Trim(),
            ChangedByUserId = adminUserId,
            ChangedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return (true, null, StatusCodes.Status200OK);
    }

    public async Task<(bool Ok, ApiError? Error, int Status)> AssignTechnicianAsync(int id, int technicianId, string adminUserId, string? note)
    {
        var booking = await _db.Bookings
            .Include(item => item.StatusHistory)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (booking is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy lịch hẹn." }, StatusCodes.Status404NotFound);
        }

        if (booking.Status == BookingStatus.Completed || booking.Status == BookingStatus.Cancelled)
        {
            return (false, new ApiError { Message = "Không thể phân công kỹ thuật viên cho lịch hẹn đã hoàn thành hoặc đã hủy." }, StatusCodes.Status400BadRequest);
        }

        var technician = await _db.Technicians
            .Include(item => item.User)
            .FirstOrDefaultAsync(item => item.Id == technicianId && item.IsActive);

        if (technician is null)
        {
            return (false, new ApiError { Message = "Kỹ thuật viên không tồn tại hoặc đã bị vô hiệu hóa." }, StatusCodes.Status400BadRequest);
        }

        if (technician.ServiceAreaId != booking.ServiceAreaId)
        {
            return (false, new ApiError { Message = "Kỹ thuật viên không phụ trách khu vực của lịch hẹn này." }, StatusCodes.Status400BadRequest);
        }

        var prevStatus = booking.Status;
        booking.TechnicianId = technicianId;
        // When assigned, transition status to Assigned
        booking.Status = BookingStatus.Assigned;

        var defaultNote = $"Admin phân công kỹ thuật viên {technician.User.FullName} đến nhà sửa chữa.";

        _db.BookingStatusHistories.Add(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = prevStatus,
            ToStatus = BookingStatus.Assigned,
            Note = string.IsNullOrWhiteSpace(note) ? defaultNote : note.Trim(),
            ChangedByUserId = adminUserId,
            ChangedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return (true, null, StatusCodes.Status200OK);
    }

    public async Task<(bool Ok, ApiError? Error, int Status)> CancelBookingAsync(int id, string adminUserId, string? reason)
    {
        var booking = await _db.Bookings
            .Include(item => item.StatusHistory)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (booking is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy lịch hẹn." }, StatusCodes.Status404NotFound);
        }

        if (booking.Status == BookingStatus.Completed || booking.Status == BookingStatus.Cancelled)
        {
            return (false, new ApiError { Message = "Lịch đã hoàn thành hoặc đã hủy trước đó." }, StatusCodes.Status400BadRequest);
        }

        var from = booking.Status;
        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;
        booking.CancelReason = string.IsNullOrWhiteSpace(reason) ? "Admin hủy lịch" : reason.Trim();

        _db.BookingStatusHistories.Add(new BookingStatusHistory
        {
            BookingId = booking.Id,
            FromStatus = from,
            ToStatus = BookingStatus.Cancelled,
            Note = booking.CancelReason,
            ChangedByUserId = adminUserId,
            ChangedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return (true, null, StatusCodes.Status200OK);
    }

    public async Task<List<CustomerSummaryDto>> GetCustomersAsync(string? search)
    {
        var customers = await _users.GetUsersInRoleAsync(AppRoles.Customer);
        var customerIds = customers.Select(item => item.Id).ToList();

        var bookingCounts = await _db.Bookings
            .Where(item => customerIds.Contains(item.CustomerId))
            .GroupBy(item => item.CustomerId)
            .Select(group => new
            {
                CustomerId = group.Key,
                Total = group.Count(),
                Completed = group.Count(b => b.Status == BookingStatus.Completed)
            })
            .ToDictionaryAsync(item => item.CustomerId);

        var list = customers.Select(user =>
        {
            var counts = bookingCounts.GetValueOrDefault(user.Id);
            return new CustomerSummaryDto(
                user.Id,
                user.FullName,
                user.Email ?? string.Empty,
                user.PhoneNumber,
                user.IsActive,
                DateTime.SpecifyKind(user.CreatedAt, DateTimeKind.Utc),
                counts?.Total ?? 0,
                counts?.Completed ?? 0);
        });

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLowerInvariant();
            list = list.Where(c =>
                c.FullName.ToLowerInvariant().Contains(q) ||
                c.Email.ToLowerInvariant().Contains(q) ||
                (c.PhoneNumber != null && c.PhoneNumber.Contains(q)));
        }

        return list.OrderByDescending(c => c.CreatedAt).ToList();
    }

    public async Task<CustomerDetailDto?> GetCustomerDetailAsync(string id)
    {
        var user = await _users.FindByIdAsync(id);
        if (user is null || !await _users.IsInRoleAsync(user, AppRoles.Customer))
        {
            return null;
        }

        var bookings = await _db.Bookings.AsNoTracking()
            .Include(item => item.ServiceArea)
            .Include(item => item.Technician)!.ThenInclude(item => item!.User)
            .Include(item => item.Services).ThenInclude(s => s.RepairService).ThenInclude(r => r.ServiceCategory)
            .Include(item => item.StatusHistory)
            .Include(item => item.Review)
            .Where(item => item.CustomerId == id)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync();

        var bookingDtos = bookings.Select(b =>
        {
            var firstCat = b.Services.FirstOrDefault()?.RepairService?.ServiceCategory?.Name ?? "Sửa chữa nhà cửa";
            var primarySvc = b.Services.Count > 0 ? string.Join(", ", b.Services.Select(s => s.ServiceName)) : "Dịch vụ sửa chữa";
            var fullAddr = BuildFullAddress(b);

            return new BookingSummaryDto(
                b.Id,
                b.BookingCode,
                b.CustomerName,
                b.CustomerPhone,
                firstCat,
                primarySvc,
                b.ServiceArea?.Name ?? string.Empty,
                fullAddr,
                b.AppointmentDate,
                b.SlotStart.ToString("HH:mm"),
                b.Status,
                b.EstimatedTotal,
                b.ActualCost,
                b.Technician?.User.FullName,
                DateTime.SpecifyKind(b.CreatedAt, DateTimeKind.Utc),
                b.Review != null);
        }).ToList();

        return new CustomerDetailDto(
            user.Id,
            user.FullName,
            user.Email ?? string.Empty,
            user.PhoneNumber,
            user.IsActive,
            DateTime.SpecifyKind(user.CreatedAt, DateTimeKind.Utc),
            bookingDtos);
    }

    public async Task<(bool Ok, ApiError? Error, int Status)> ToggleCustomerStatusAsync(string id)
    {
        var user = await _users.FindByIdAsync(id);
        if (user is null || !await _users.IsInRoleAsync(user, AppRoles.Customer))
        {
            return (false, new ApiError { Message = "Không tìm thấy khách hàng." }, StatusCodes.Status404NotFound);
        }

        user.IsActive = !user.IsActive;
        await _users.UpdateAsync(user);
        return (true, null, StatusCodes.Status200OK);
    }

    public async Task<List<AdminSummaryDto>> GetAdminsAsync(string? search = null)
    {
        var admins = await _users.GetUsersInRoleAsync(AppRoles.Admin);
        var list = admins.Select(u => new AdminSummaryDto(
            u.Id,
            u.FullName,
            u.Email ?? string.Empty,
            u.PhoneNumber,
            u.IsActive,
            DateTime.SpecifyKind(u.CreatedAt, DateTimeKind.Utc)));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLowerInvariant();
            list = list.Where(a =>
                a.FullName.ToLowerInvariant().Contains(q) ||
                a.Email.ToLowerInvariant().Contains(q) ||
                (a.PhoneNumber != null && a.PhoneNumber.Contains(q)));
        }

        return list.OrderBy(a => a.FullName).ToList();
    }

    public async Task<(bool Ok, ApiError? Error, int Status)> ToggleAdminStatusAsync(string id, string currentUserId)
    {
        if (id == currentUserId)
        {
            return (false, new ApiError { Message = "Không thể tự vô hiệu hóa tài khoản quản trị của chính mình." }, StatusCodes.Status400BadRequest);
        }

        var user = await _users.FindByIdAsync(id);
        if (user is null || !await _users.IsInRoleAsync(user, AppRoles.Admin))
        {
            return (false, new ApiError { Message = "Không tìm thấy quản trị viên." }, StatusCodes.Status404NotFound);
        }

        user.IsActive = !user.IsActive;
        await _users.UpdateAsync(user);
        return (true, null, StatusCodes.Status200OK);
    }

    public async Task<(AdminSummaryDto? Data, ApiError? Error, int Status)> CreateAdminAsync(CreateAdminRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await _users.FindByEmailAsync(email) is not null)
        {
            return (null, new ApiError { Message = "Email này đã được sử dụng." }, StatusCodes.Status409Conflict);
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = request.FullName.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _users.CreateAsync(user, request.Password);
        if (!created.Succeeded)
        {
            return (null, new ApiError { Message = "Không tạo được tài khoản Admin: " + string.Join(", ", created.Errors.Select(e => e.Description)) }, StatusCodes.Status400BadRequest);
        }

        await _users.AddToRoleAsync(user, AppRoles.Admin);

        var dto = new AdminSummaryDto(user.Id, user.FullName, user.Email, user.PhoneNumber, user.IsActive, DateTime.SpecifyKind(user.CreatedAt, DateTimeKind.Utc));
        return (dto, null, StatusCodes.Status201Created);
    }

    private IQueryable<Booking> AdminQuery() => _db.Bookings.AsNoTracking()
        .Include(item => item.Customer)
        .Include(item => item.ServiceArea)
        .Include(item => item.Technician)!.ThenInclude(item => item!.User)
        .Include(item => item.Services).ThenInclude(s => s.RepairService).ThenInclude(r => r.ServiceCategory)
        .Include(item => item.StatusHistory);

    private static string BuildFullAddress(Booking b)
    {
        var parts = new List<string> { b.AddressLine };
        if (!string.IsNullOrWhiteSpace(b.Ward)) parts.Add(b.Ward);
        if (!string.IsNullOrWhiteSpace(b.District)) parts.Add(b.District);
        if (!string.IsNullOrWhiteSpace(b.City)) parts.Add(b.City);
        return string.Join(", ", parts);
    }

    private static AdminBookingDto ToAdminDto(Booking booking)
    {
        var firstCat = booking.Services.FirstOrDefault()?.RepairService?.ServiceCategory?.Name ?? "Sửa chữa nhà cửa";
        var fullAddr = BuildFullAddress(booking);

        return new(
            booking.Id,
            booking.BookingCode,
            booking.CustomerId,
            booking.CustomerName,
            booking.Customer?.Email ?? string.Empty,
            booking.CustomerPhone,
            fullAddr,
            booking.AddressLine,
            booking.Ward,
            booking.District,
            booking.City,
            firstCat,
            booking.ServiceAreaId,
            booking.ServiceArea?.Name ?? string.Empty,
            booking.AppointmentDate,
            booking.SlotStart.ToString("HH:mm"),
            booking.SlotEnd.ToString("HH:mm"),
            booking.Status,
            booking.ProblemDescription,
            booking.EstimatedTotal,
            booking.ActualCost,
            booking.TechnicianId,
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
            booking.StatusHistory.OrderBy(item => item.ChangedAt).Select(item => new BookingHistoryDto(item.FromStatus, item.ToStatus, item.Note, DateTime.SpecifyKind(item.ChangedAt, DateTimeKind.Utc))).ToList());
    }
}
