using Microsoft.EntityFrameworkCore;
using PhoneRepairBooking.Api.Data;
using PhoneRepairBooking.Api.Domain;
using PhoneRepairBooking.Api.DTOs;

namespace PhoneRepairBooking.Api.Services;

public class ReviewService
{
    private readonly AppDbContext _db;

    public ReviewService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<(bool Ok, ApiError? Error, int Status, ReviewDto? Data)> SubmitReviewAsync(
        string customerUserId,
        int bookingId,
        SubmitReviewRequest request)
    {
        if (request.Rating < 1 || request.Rating > 5)
        {
            return (false, new ApiError { Message = "Số sao đánh giá phải từ 1 đến 5 sao." }, 400, null);
        }

        var booking = await _db.Bookings
            .Include(b => b.Customer)
            .Include(b => b.ServiceArea)
            .Include(b => b.Technician).ThenInclude(t => t!.User)
            .Include(b => b.Services).ThenInclude(s => s.RepairService).ThenInclude(r => r.ServiceCategory)
            .Include(b => b.Review)
            .FirstOrDefaultAsync(b => b.Id == bookingId);

        if (booking is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy lịch hẹn." }, 404, null);
        }

        if (booking.CustomerId != customerUserId)
        {
            return (false, new ApiError { Message = "Bạn chỉ có thể đánh giá lịch hẹn của chính mình." }, 403, null);
        }

        if (booking.Status != BookingStatus.Completed)
        {
            return (false, new ApiError
            {
                Message = $"Chỉ có thể đánh giá ca sửa chữa đã hoàn thành (Completed). Trạng thái hiện tại: {booking.Status}."
            }, 400, null);
        }

        var comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim();
        var now = DateTime.UtcNow;

        Review review;
        if (booking.Review is not null)
        {
            review = booking.Review;
            review.Rating = request.Rating;
            review.Comment = comment;
        }
        else
        {
            review = new Review
            {
                BookingId = booking.Id,
                CustomerId = customerUserId,
                Rating = request.Rating,
                Comment = comment,
                CreatedAt = now,
            };
            _db.Reviews.Add(review);
            booking.Review = review;
        }

        await _db.SaveChangesAsync();

        var dto = ToDto(review, booking);
        return (true, null, 200, dto);
    }

    public async Task<ReviewDto?> GetBookingReviewAsync(string customerUserId, int bookingId)
    {
        var review = await _db.Reviews
            .Include(r => r.Booking).ThenInclude(b => b.ServiceArea)
            .Include(r => r.Booking).ThenInclude(b => b.Technician).ThenInclude(t => t!.User)
            .Include(r => r.Booking).ThenInclude(b => b.Services).ThenInclude(s => s.RepairService).ThenInclude(r => r.ServiceCategory)
            .Include(r => r.Customer)
            .FirstOrDefaultAsync(r => r.BookingId == bookingId && r.CustomerId == customerUserId);

        return review is null ? null : ToDto(review, review.Booking);
    }

    public async Task<List<ReviewDto>> GetPublicReviewsAsync(int? limit = 10)
    {
        var query = _db.Reviews
            .AsNoTracking()
            .Include(r => r.Booking).ThenInclude(b => b.ServiceArea)
            .Include(r => r.Booking).ThenInclude(b => b.Technician).ThenInclude(t => t!.User)
            .Include(r => r.Booking).ThenInclude(b => b.Services).ThenInclude(s => s.RepairService).ThenInclude(r => r.ServiceCategory)
            .Include(r => r.Customer)
            .OrderByDescending(r => r.CreatedAt);

        var list = limit.HasValue ? await query.Take(limit.Value).ToListAsync() : await query.ToListAsync();
        return list.Select(r => ToDto(r, r.Booking)).ToList();
    }

    public async Task<List<ReviewDto>> GetAdminReviewsAsync(AdminReviewFilterRequest filter)
    {
        var query = _db.Reviews
            .AsNoTracking()
            .Include(r => r.Booking).ThenInclude(b => b.ServiceArea)
            .Include(r => r.Booking).ThenInclude(b => b.Technician).ThenInclude(t => t!.User)
            .Include(r => r.Booking).ThenInclude(b => b.Services).ThenInclude(s => s.RepairService).ThenInclude(r => r.ServiceCategory)
            .Include(r => r.Customer)
            .AsQueryable();

        if (filter.Rating.HasValue)
        {
            query = query.Where(r => r.Rating == filter.Rating.Value);
        }

        var areaId = filter.ServiceAreaId ?? filter.BranchId;
        if (areaId.HasValue)
        {
            query = query.Where(r => r.Booking.ServiceAreaId == areaId.Value);
        }

        if (filter.TechnicianId.HasValue)
        {
            query = query.Where(r => r.Booking.TechnicianId == filter.TechnicianId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var q = filter.Search.Trim().ToLower();
            query = query.Where(r =>
                r.Customer.FullName.ToLower().Contains(q) ||
                (r.Customer.Email != null && r.Customer.Email.ToLower().Contains(q)) ||
                r.Booking.BookingCode.ToLower().Contains(q) ||
                (r.Comment != null && r.Comment.ToLower().Contains(q)) ||
                r.Booking.Services.Any(s => s.ServiceName.ToLower().Contains(q)) ||
                (r.Booking.Technician != null && r.Booking.Technician.User.FullName.ToLower().Contains(q)));
        }

        var rows = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return rows.Select(r => ToDto(r, r.Booking)).ToList();
    }

    public async Task<ReviewSummaryStatsDto> GetAdminReviewStatsAsync()
    {
        var reviews = await _db.Reviews.AsNoTracking().ToListAsync();
        var total = reviews.Count;
        var avg = total > 0 ? Math.Round(reviews.Average(r => r.Rating), 1) : 5.0;

        return new ReviewSummaryStatsDto(
            total,
            avg,
            reviews.Count(r => r.Rating == 5),
            reviews.Count(r => r.Rating == 4),
            reviews.Count(r => r.Rating == 3),
            reviews.Count(r => r.Rating == 2),
            reviews.Count(r => r.Rating == 1),
            0);
    }

    public async Task<(bool Ok, ApiError? Error, int Status)> ToggleVisibilityAsync(int reviewId, bool isVisible)
    {
        var review = await _db.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId);
        if (review is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy đánh giá." }, 404);
        }

        await _db.SaveChangesAsync();
        return (true, null, 200);
    }

    public async Task<(bool Ok, ApiError? Error, int Status)> DeleteReviewAsync(int reviewId)
    {
        var review = await _db.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId);
        if (review is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy đánh giá." }, 404);
        }

        _db.Reviews.Remove(review);
        await _db.SaveChangesAsync();
        return (true, null, 200);
    }

    public async Task<List<ReviewDto>> GetCustomerReviewsAsync(string customerUserId)
    {
        var list = await _db.Reviews
            .AsNoTracking()
            .Include(r => r.Booking).ThenInclude(b => b.ServiceArea)
            .Include(r => r.Booking).ThenInclude(b => b.Technician).ThenInclude(t => t!.User)
            .Include(r => r.Booking).ThenInclude(b => b.Services).ThenInclude(s => s.RepairService).ThenInclude(r => r.ServiceCategory)
            .Include(r => r.Customer)
            .Where(r => r.CustomerId == customerUserId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return list.Select(r => ToDto(r, r.Booking)).ToList();
    }

    public static ReviewDto ToDto(Review r, Booking b)
    {
        var firstCat = b.Services.FirstOrDefault()?.RepairService?.ServiceCategory?.Name ?? "Sửa chữa nhà cửa";
        var primarySvc = b.Services.Count > 0 ? string.Join(", ", b.Services.Select(s => s.ServiceName)) : "Dịch vụ sửa chữa";

        return new ReviewDto(
            r.Id,
            r.BookingId,
            b.BookingCode,
            r.CustomerId,
            r.Customer?.FullName ?? b.Customer?.FullName ?? b.CustomerName,
            r.Rating,
            r.Comment,
            true,
            r.CreatedAt,
            null,
            primarySvc,
            firstCat,
            b.ServiceArea?.Name ?? string.Empty,
            b.Technician?.User?.FullName);
    }
}
