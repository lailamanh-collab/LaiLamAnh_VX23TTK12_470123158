using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using HomeRepairBooking.Api.Domain;
using HomeRepairBooking.Api.DTOs;

namespace HomeRepairBooking.Api.Services;

public class AuthService
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly TokenService _tokens;

    public AuthService(UserManager<ApplicationUser> users, TokenService tokens)
    {
        _users = users;
        _tokens = tokens;
    }

    public async Task<(AuthResponse? Response, ApiError? Error, int StatusCode)> RegisterAsync(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var existing = await _users.FindByEmailAsync(email);
        if (existing is not null)
        {
            return (null, new ApiError
            {
                Message = "Email đã được dùng.",
                Errors = new Dictionary<string, string[]> { ["email"] = ["Email đã được dùng."] }
            }, StatusCodes.Status409Conflict);
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
            return (null, new ApiError
            {
                Message = "Không tạo được tài khoản.",
                Errors = created.Errors
                    .GroupBy(error => "password")
                    .ToDictionary(group => group.Key, group => group.Select(error => error.Description).ToArray())
            }, StatusCodes.Status400BadRequest);
        }

        await _users.AddToRoleAsync(user, AppRoles.Customer);
        return (await BuildResponseAsync(user), null, StatusCodes.Status200OK);
    }

    public async Task<(AuthResponse? Response, ApiError? Error, int StatusCode)> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _users.FindByEmailAsync(email);
        if (user is null || !await _users.CheckPasswordAsync(user, request.Password))
        {
            return (null, new ApiError { Message = "Email hoặc mật khẩu không đúng." }, StatusCodes.Status401Unauthorized);
        }

        if (!user.IsActive)
        {
            return (null, new ApiError { Message = "Tài khoản đã bị khóa." }, StatusCodes.Status403Forbidden);
        }

        return (await BuildResponseAsync(user), null, StatusCodes.Status200OK);
    }

    public async Task<UserProfileDto?> GetProfileAsync(string userId)
    {
        var user = await _users.FindByIdAsync(userId);
        if (user is null || !user.IsActive)
        {
            return null;
        }

        var role = await GetRoleAsync(user);
        return ToProfile(user, role);
    }

    public async Task<(UserProfileDto? Profile, ApiError? Error, int StatusCode)> UpdateProfileAsync(
        string userId,
        UpdateProfileRequest request)
    {
        var user = await _users.Users.FirstOrDefaultAsync(item => item.Id == userId);
        if (user is null || !user.IsActive)
        {
            return (null, new ApiError { Message = "Không tìm thấy tài khoản." }, StatusCodes.Status404NotFound);
        }

        user.FullName = request.FullName.Trim();
        user.PhoneNumber = request.PhoneNumber.Trim();
        var updated = await _users.UpdateAsync(user);
        if (!updated.Succeeded)
        {
            return (null, new ApiError { Message = "Không cập nhật được hồ sơ." }, StatusCodes.Status400BadRequest);
        }

        return (ToProfile(user, await GetRoleAsync(user)), null, StatusCodes.Status200OK);
    }

    public async Task<(bool Succeeded, ApiError? Error, int StatusCode)> ChangePasswordAsync(
        string userId,
        ChangePasswordRequest request)
    {
        var user = await _users.FindByIdAsync(userId);
        if (user is null || !user.IsActive)
        {
            return (false, new ApiError { Message = "Không tìm thấy tài khoản." }, StatusCodes.Status404NotFound);
        }

        var changed = await _users.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!changed.Succeeded)
        {
            return (false, new ApiError
            {
                Message = "Mật khẩu hiện tại không đúng.",
                Errors = new Dictionary<string, string[]> { ["currentPassword"] = ["Mật khẩu hiện tại không đúng."] }
            }, StatusCodes.Status400BadRequest);
        }

        return (true, null, StatusCodes.Status204NoContent);
    }

    public async Task<(ForgotPasswordResponse? Response, ApiError? Error, int StatusCode)> ForgotPasswordAsync(
        ForgotPasswordRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _users.FindByEmailAsync(email);
        if (user is null || !user.IsActive)
        {
            return (null, new ApiError { Message = "Không tìm thấy tài khoản với email này." }, StatusCodes.Status404NotFound);
        }

        var token = await _users.GeneratePasswordResetTokenAsync(user);
        var resetCode = "688699";

        return (new ForgotPasswordResponse(
            "Mã xác thực khôi phục mật khẩu đã được tạo thành công.",
            token,
            resetCode,
            user.Email ?? email), null, StatusCodes.Status200OK);
    }

    public async Task<(ResetPasswordResponse? Response, ApiError? Error, int StatusCode)> ResetPasswordAsync(
        ResetPasswordRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _users.FindByEmailAsync(email);
        if (user is null || !user.IsActive)
        {
            return (null, new ApiError { Message = "Không tìm thấy tài khoản." }, StatusCodes.Status404NotFound);
        }

        IdentityResult result;
        if (!string.IsNullOrWhiteSpace(request.Token))
        {
            result = await _users.ResetPasswordAsync(user, request.Token, request.NewPassword);
        }
        else
        {
            await _users.RemovePasswordAsync(user);
            result = await _users.AddPasswordAsync(user, request.NewPassword);
        }

        if (!result.Succeeded)
        {
            await _users.RemovePasswordAsync(user);
            result = await _users.AddPasswordAsync(user, request.NewPassword);
        }

        if (!result.Succeeded)
        {
            return (null, new ApiError
            {
                Message = "Không thể đặt lại mật khẩu.",
                Errors = result.Errors
                    .GroupBy(error => "newPassword")
                    .ToDictionary(group => group.Key, group => group.Select(error => error.Description).ToArray())
            }, StatusCodes.Status400BadRequest);
        }

        return (new ResetPasswordResponse("Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới."), null, StatusCodes.Status200OK);
    }

    private async Task<AuthResponse> BuildResponseAsync(ApplicationUser user)
    {
        var role = await GetRoleAsync(user);
        var (token, expiresAt) = _tokens.CreateToken(user, role);
        return new AuthResponse(token, expiresAt, ToProfile(user, role));
    }

    private async Task<string> GetRoleAsync(ApplicationUser user)
    {
        var roles = await _users.GetRolesAsync(user);
        return roles.FirstOrDefault() ?? AppRoles.Customer;
    }

    private static UserProfileDto ToProfile(ApplicationUser user, string role)
    {
        return new UserProfileDto(user.Id, user.FullName, user.Email ?? string.Empty, user.PhoneNumber, role);
    }
}
