namespace PhoneRepairBooking.Api.DTOs;

public record ReviewDto(
    int Id,
    int BookingId,
    string BookingCode,
    string CustomerId,
    string CustomerName,
    int Rating,
    string? Comment,
    bool IsVisible,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    string ServiceName,
    string CategoryName,
    string ServiceAreaName,
    string? TechnicianName)
{
    // Backward compatibility aliases
    public string PhoneModelName => ServiceName;
    public string BrandName => CategoryName;
    public string BranchName => ServiceAreaName;
}

public class SubmitReviewRequest
{
    public int Rating { get; set; }

    public string? Comment { get; set; }
}

public class AdminReviewFilterRequest
{
    public string? Search { get; set; }

    public int? Rating { get; set; }

    public int? ServiceAreaId { get; set; }

    public int? BranchId { get => ServiceAreaId; set => ServiceAreaId = value; }

    public int? TechnicianId { get; set; }

    public bool? IsVisible { get; set; }
}

public class UpdateReviewVisibilityRequest
{
    public bool IsVisible { get; set; }
}

public record ReviewSummaryStatsDto(
    int TotalReviews,
    double AverageRating,
    int FiveStarCount,
    int FourStarCount,
    int ThreeStarCount,
    int TwoStarCount,
    int OneStarCount,
    int HiddenCount);
