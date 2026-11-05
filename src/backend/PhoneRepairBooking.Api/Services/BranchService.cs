using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PhoneRepairBooking.Api.Data;
using PhoneRepairBooking.Api.Domain;
using PhoneRepairBooking.Api.DTOs;

namespace PhoneRepairBooking.Api.Services;

public class BranchService
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _users;

    public BranchService(AppDbContext db, UserManager<ApplicationUser> users)
    {
        _db = db;
        _users = users;
    }

    public async Task<List<ServiceAreaDto>> GetServiceAreasAsync(bool includeInactive)
    {
        var query = _db.ServiceAreas.AsNoTracking().Include(item => item.OpeningHours).AsQueryable();
        if (!includeInactive)
        {
            query = query.Where(item => item.IsActive);
        }

        var list = await query.OrderBy(item => item.Name).ToListAsync();
        return list.Select(ToServiceAreaDto).ToList();
    }

    public async Task<List<BranchDto>> GetBranchesAsync(bool includeInactive)
    {
        var areas = await GetServiceAreasAsync(includeInactive);
        return areas.Select(a => new BranchDto(a.Id, a.Name, a.Address, a.Phone, a.CapacityPerSlot, a.SlotMinutes, a.IsActive, a.OpeningHours)).ToList();
    }

    public async Task<(ServiceAreaDto? Data, ApiError? Error, int Status)> SaveServiceAreaAsync(int? id, ServiceAreaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Address) || string.IsNullOrWhiteSpace(request.Phone))
        {
            return (null, new ApiError { Message = "Nhập tên khu vực, địa chỉ và số điện thoại liên hệ." }, StatusCodes.Status400BadRequest);
        }

        if (request.CapacityPerSlot < 1 || request.SlotMinutes is < 15 or > 180)
        {
            return (null, new ApiError { Message = "Sức chứa hoặc thời lượng khung giờ không hợp lệ." }, StatusCodes.Status400BadRequest);
        }

        var hoursError = ValidateHours(request.OpeningHours);
        if (hoursError is not null)
        {
            return (null, new ApiError { Message = hoursError }, StatusCodes.Status400BadRequest);
        }

        ServiceArea area;
        if (id is null)
        {
            area = new ServiceArea { CreatedAt = DateTime.UtcNow };
            _db.ServiceAreas.Add(area);
        }
        else
        {
            var existing = await _db.ServiceAreas.Include(item => item.OpeningHours).FirstOrDefaultAsync(item => item.Id == id);
            if (existing is null)
            {
                return (null, new ApiError { Message = "Không tìm thấy khu vực phục vụ." }, StatusCodes.Status404NotFound);
            }

            area = existing;
            _db.ServiceAreaOpeningHours.RemoveRange(area.OpeningHours);
        }

        area.Name = request.Name.Trim();
        area.City = string.IsNullOrWhiteSpace(request.City) ? "TP. Hồ Chí Minh" : request.City.Trim();
        area.Address = request.Address.Trim();
        area.Phone = request.Phone.Trim();
        area.CapacityPerSlot = request.CapacityPerSlot;
        area.SlotMinutes = request.SlotMinutes;
        area.IsActive = request.IsActive;
        area.OpeningHours = request.OpeningHours.Select(item => new ServiceAreaOpeningHour
        {
            DayOfWeek = item.DayOfWeek,
            IsOpen = item.IsOpen,
            OpenTime = TimeOnly.Parse(item.OpenTime),
            CloseTime = TimeOnly.Parse(item.CloseTime)
        }).ToList();

        await _db.SaveChangesAsync();
        return (ToServiceAreaDto(area), null, id is null ? StatusCodes.Status201Created : StatusCodes.Status200OK);
    }

    public async Task<(BranchDto? Data, ApiError? Error, int Status)> SaveBranchAsync(int? id, BranchRequest request)
    {
        var (area, error, status) = await SaveServiceAreaAsync(id, request);
        if (area is null)
        {
            return (null, error, status);
        }
        return (new BranchDto(area.Id, area.Name, area.Address, area.Phone, area.CapacityPerSlot, area.SlotMinutes, area.IsActive, area.OpeningHours), null, status);
    }

    public async Task<List<TechnicianDto>> GetTechniciansAsync(bool includeInactive)
    {
        var query = _db.Technicians.AsNoTracking()
            .Include(item => item.User)
            .Include(item => item.ServiceArea)
            .Include(item => item.Schedules)
            .AsQueryable();
        if (!includeInactive)
        {
            query = query.Where(item => item.IsActive);
        }

        var rows = await query.OrderBy(item => item.User.FullName).ToListAsync();
        return rows.Select(ToTechnician).ToList();
    }

    public async Task<(TechnicianDto? Data, ApiError? Error, int Status)> CreateTechnicianAsync(CreateTechnicianRequest request)
    {
        var area = await _db.ServiceAreas.FirstOrDefaultAsync(item => item.Id == request.ServiceAreaId && item.IsActive);
        if (area is null)
        {
            return (null, new ApiError { Message = "Khu vực phục vụ không hợp lệ." }, StatusCodes.Status400BadRequest);
        }

        var email = request.Email.Trim().ToLowerInvariant();
        if (await _users.FindByEmailAsync(email) is not null)
        {
            return (null, new ApiError { Message = "Email đã được dùng." }, StatusCodes.Status409Conflict);
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = request.FullName.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        var created = await _users.CreateAsync(user, request.Password);
        if (!created.Succeeded)
        {
            return (null, new ApiError { Message = "Không tạo được tài khoản kỹ thuật viên." }, StatusCodes.Status400BadRequest);
        }

        await _users.AddToRoleAsync(user, AppRoles.Technician);
        var technician = new Technician
        {
            UserId = user.Id,
            User = user,
            ServiceAreaId = area.Id,
            ServiceArea = area,
            Specialty = request.Specialty?.Trim(),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            Schedules = DefaultSchedule()
        };
        _db.Technicians.Add(technician);
        await _db.SaveChangesAsync();
        return (ToTechnician(technician), null, StatusCodes.Status201Created);
    }

    public async Task<(TechnicianDto? Data, ApiError? Error, int Status)> UpdateTechnicianAsync(int id, UpdateTechnicianRequest request)
    {
        var technician = await _db.Technicians.Include(item => item.User).Include(item => item.ServiceArea).Include(item => item.Schedules)
            .FirstOrDefaultAsync(item => item.Id == id);
        if (technician is null)
        {
            return (null, new ApiError { Message = "Không tìm thấy kỹ thuật viên." }, StatusCodes.Status404NotFound);
        }

        var area = await _db.ServiceAreas.FirstOrDefaultAsync(item => item.Id == request.ServiceAreaId);
        if (area is null)
        {
            return (null, new ApiError { Message = "Khu vực phục vụ không hợp lệ." }, StatusCodes.Status400BadRequest);
        }

        technician.User.FullName = request.FullName.Trim();
        technician.User.PhoneNumber = request.PhoneNumber.Trim();
        technician.ServiceAreaId = area.Id;
        technician.ServiceArea = area;
        technician.Specialty = request.Specialty?.Trim();
        technician.IsActive = request.IsActive;
        await _users.UpdateAsync(technician.User);
        await _db.SaveChangesAsync();
        return (ToTechnician(technician), null, StatusCodes.Status200OK);
    }

    public async Task<(TechnicianDto? Data, ApiError? Error, int Status)> SaveScheduleAsync(int id, ScheduleRequest request)
    {
        var technician = await _db.Technicians.Include(item => item.User).Include(item => item.ServiceArea).Include(item => item.Schedules)
            .FirstOrDefaultAsync(item => item.Id == id);
        if (technician is null)
        {
            return (null, new ApiError { Message = "Không tìm thấy kỹ thuật viên." }, StatusCodes.Status404NotFound);
        }

        foreach (var item in request.Schedules.Where(item => item.IsWorking))
        {
            if (!TimeOnly.TryParse(item.StartTime, out var start) || !TimeOnly.TryParse(item.EndTime, out var end) || end <= start)
            {
                return (null, new ApiError { Message = "Giờ làm việc không hợp lệ." }, StatusCodes.Status400BadRequest);
            }
        }

        _db.TechnicianSchedules.RemoveRange(technician.Schedules);
        technician.Schedules = request.Schedules.Select(item => new TechnicianSchedule
        {
            DayOfWeek = item.DayOfWeek,
            IsWorking = item.IsWorking,
            StartTime = TimeOnly.Parse(string.IsNullOrWhiteSpace(item.StartTime) ? "08:00" : item.StartTime),
            EndTime = TimeOnly.Parse(string.IsNullOrWhiteSpace(item.EndTime) ? "17:00" : item.EndTime)
        }).ToList();
        await _db.SaveChangesAsync();
        return (ToTechnician(technician), null, StatusCodes.Status200OK);
    }

    public async Task<TechnicianDto?> GetOwnProfileAsync(string userId)
    {
        var technician = await _db.Technicians.AsNoTracking()
            .Include(item => item.User)
            .Include(item => item.ServiceArea)
            .Include(item => item.Schedules)
            .FirstOrDefaultAsync(item => item.UserId == userId);
        return technician is null ? null : ToTechnician(technician);
    }

    public static List<OpeningHourDto> DefaultHours()
    {
        return Enum.GetValues<DayOfWeek>().Select(day =>
        {
            var open = day is not DayOfWeek.Sunday;
            return new OpeningHourDto(day, open, "08:00", "18:00");
        }).ToList();
    }

    private static List<TechnicianSchedule> DefaultSchedule()
    {
        return Enum.GetValues<DayOfWeek>().Select(day => new TechnicianSchedule
        {
            DayOfWeek = day,
            IsWorking = day is not DayOfWeek.Sunday,
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(17, 30)
        }).ToList();
    }

    private static string? ValidateHours(List<OpeningHourDto> hours)
    {
        if (hours.Count == 0)
        {
            return "Chưa có giờ làm việc phục vụ.";
        }

        foreach (var hour in hours.Where(item => item.IsOpen))
        {
            if (!TimeOnly.TryParse(hour.OpenTime, out var open) || !TimeOnly.TryParse(hour.CloseTime, out var close) || close <= open)
            {
                return "Giờ kết thúc phải sau giờ bắt đầu.";
            }
        }

        return null;
    }

    private static ServiceAreaDto ToServiceAreaDto(ServiceArea area) => new(
        area.Id,
        area.Name,
        area.City,
        area.Address,
        area.Phone,
        area.CapacityPerSlot,
        area.SlotMinutes,
        area.IsActive,
        area.OpeningHours.OrderBy(item => item.DayOfWeek).Select(item =>
            new OpeningHourDto(item.DayOfWeek, item.IsOpen, item.OpenTime.ToString("HH:mm"), item.CloseTime.ToString("HH:mm"))).ToList());

    private static TechnicianDto ToTechnician(Technician technician) => new(
        technician.Id,
        technician.User.FullName,
        technician.User.Email ?? string.Empty,
        technician.User.PhoneNumber,
        technician.ServiceAreaId,
        technician.ServiceArea?.Name ?? string.Empty,
        technician.Specialty,
        technician.IsActive,
        technician.Schedules.OrderBy(item => item.DayOfWeek).Select(item =>
            new ScheduleDto(item.DayOfWeek, item.IsWorking, item.StartTime.ToString("HH:mm"), item.EndTime.ToString("HH:mm"))).ToList());
}
