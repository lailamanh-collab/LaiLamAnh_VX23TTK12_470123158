namespace PhoneRepairBooking.Api.DTOs;

public class ApiError
{
    public string Message { get; set; } = string.Empty;

    public Dictionary<string, string[]>? Errors { get; set; }
}

public record UserProfileDto(string Id, string FullName, string Email, string? PhoneNumber, string Role);

public record AuthResponse(string AccessToken, DateTime ExpiresAt, UserProfileDto User);

public class RegisterRequest
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string ConfirmPassword { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}

public class UpdateProfileRequest
{
    public string FullName { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;

    public string NewPassword { get; set; } = string.Empty;

    public string ConfirmPassword { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public record ForgotPasswordResponse(string Message, string ResetToken, string ResetCode, string Email);

public class ResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;

    public string Token { get; set; } = string.Empty;

    public string NewPassword { get; set; } = string.Empty;

    public string ConfirmPassword { get; set; } = string.Empty;
}

public record ResetPasswordResponse(string Message);
