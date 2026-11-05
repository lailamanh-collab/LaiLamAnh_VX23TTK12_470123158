using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using PhoneRepairBooking.Api.DTOs;
using PhoneRepairBooking.Api.Services;

namespace PhoneRepairBooking.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly IValidator<RegisterRequest> _registerValidator;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly IValidator<ForgotPasswordRequest> _forgotValidator;
    private readonly IValidator<ResetPasswordRequest> _resetValidator;

    public AuthController(
        AuthService auth,
        IValidator<RegisterRequest> registerValidator,
        IValidator<LoginRequest> loginValidator,
        IValidator<ForgotPasswordRequest> forgotValidator,
        IValidator<ResetPasswordRequest> resetValidator)
    {
        _auth = auth;
        _registerValidator = registerValidator;
        _loginValidator = loginValidator;
        _forgotValidator = forgotValidator;
        _resetValidator = resetValidator;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var invalid = await ValidateAsync(_registerValidator, request);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        var (response, error, statusCode) = await _auth.RegisterAsync(request);
        if (error is not null)
        {
            return StatusCode(statusCode, error);
        }

        return Ok(response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var invalid = await ValidateAsync(_loginValidator, request);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        var (response, error, statusCode) = await _auth.LoginAsync(request);
        if (error is not null)
        {
            return StatusCode(statusCode, error);
        }

        return Ok(response);
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ForgotPasswordResponse>> ForgotPassword(ForgotPasswordRequest request)
    {
        var invalid = await ValidateAsync(_forgotValidator, request);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        var (response, error, statusCode) = await _auth.ForgotPasswordAsync(request);
        if (error is not null)
        {
            return StatusCode(statusCode, error);
        }

        return Ok(response);
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<ResetPasswordResponse>> ResetPassword(ResetPasswordRequest request)
    {
        var invalid = await ValidateAsync(_resetValidator, request);
        if (invalid is not null)
        {
            return BadRequest(invalid);
        }

        var (response, error, statusCode) = await _auth.ResetPasswordAsync(request);
        if (error is not null)
        {
            return StatusCode(statusCode, error);
        }

        return Ok(response);
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
                .GroupBy(error => ToCamel(error.PropertyName))
                .ToDictionary(group => group.Key, group => group.Select(error => error.ErrorMessage).ToArray())
        };
    }

    private static string ToCamel(string name)
    {
        if (string.IsNullOrEmpty(name) || char.IsLower(name[0]))
        {
            return name;
        }

        return char.ToLowerInvariant(name[0]) + name[1..];
    }
}
