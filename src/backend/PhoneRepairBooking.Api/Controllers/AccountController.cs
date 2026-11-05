using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhoneRepairBooking.Api.DTOs;
using PhoneRepairBooking.Api.Services;

namespace PhoneRepairBooking.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/account")]
public class AccountController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly IValidator<UpdateProfileRequest> _profileValidator;
    private readonly IValidator<ChangePasswordRequest> _passwordValidator;

    public AccountController(
        AuthService auth,
        IValidator<UpdateProfileRequest> profileValidator,
        IValidator<ChangePasswordRequest> passwordValidator)
    {
        _auth = auth;
        _profileValidator = profileValidator;
        _passwordValidator = passwordValidator;
    }

    [HttpGet("profile")]
    public async Task<ActionResult<UserProfileDto>> GetProfile()
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var profile = await _auth.GetProfileAsync(userId);
        if (profile is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        return Ok(profile);
    }

    [HttpPut("profile")]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile(UpdateProfileRequest request)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var invalid = await ValidateAsync(_profileValidator, request);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        var (profile, error, statusCode) = await _auth.UpdateProfileAsync(userId, request);
        if (error is not null)
        {
            return StatusCode(statusCode, error);
        }

        return Ok(profile);
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized(new ApiError { Message = "Bạn cần đăng nhập." });
        }

        var invalid = await ValidateAsync(_passwordValidator, request);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        var (succeeded, error, statusCode) = await _auth.ChangePasswordAsync(userId, request);
        if (!succeeded && error is not null)
        {
            return StatusCode(statusCode, error);
        }

        return NoContent();
    }

    private string? GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    private static async Task<ApiError?> ValidateAsync<T>(IValidator<T> validator, T request)
    {
        var result = await validator.ValidateAsync(request);
        if (result.IsValid)
        {
            return null;
        }

        return new ApiError
        {
            Message = "Dữ liệu chưa hợp lệ.",
            Errors = result.Errors
                .GroupBy(error =>
                {
                    var name = error.PropertyName;
                    return string.IsNullOrEmpty(name) || char.IsLower(name[0])
                        ? name
                        : char.ToLowerInvariant(name[0]) + name[1..];
                })
                .ToDictionary(group => group.Key, group => group.Select(error => error.ErrorMessage).ToArray())
        };
    }
}
