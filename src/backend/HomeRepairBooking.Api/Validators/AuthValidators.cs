using FluentValidation;
using HomeRepairBooking.Api.DTOs;

namespace HomeRepairBooking.Api.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().WithMessage("Nhập họ tên.").MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().WithMessage("Nhập email.").EmailAddress().WithMessage("Email không hợp lệ.");
        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Nhập số điện thoại.")
            .Matches(@"^[0-9+\s]{8,15}$").WithMessage("Số điện thoại không hợp lệ.");
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Nhập mật khẩu.")
            .MinimumLength(8).WithMessage("Mật khẩu tối thiểu 8 ký tự.")
            .Matches("[A-Z]").WithMessage("Mật khẩu cần một chữ hoa.")
            .Matches("[a-z]").WithMessage("Mật khẩu cần một chữ thường.")
            .Matches("[0-9]").WithMessage("Mật khẩu cần một chữ số.");
        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password).WithMessage("Mật khẩu nhập lại chưa khớp.");
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().WithMessage("Nhập email.").EmailAddress().WithMessage("Email không hợp lệ.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Nhập mật khẩu.");
    }
}

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().WithMessage("Nhập họ tên.").MaximumLength(100);
        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Nhập số điện thoại.")
            .Matches(@"^[0-9+\s]{8,15}$").WithMessage("Số điện thoại không hợp lệ.");
    }
}

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty().WithMessage("Nhập mật khẩu hiện tại.");
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Nhập mật khẩu mới.")
            .MinimumLength(8).WithMessage("Mật khẩu tối thiểu 8 ký tự.")
            .Matches("[A-Z]").WithMessage("Mật khẩu cần một chữ hoa.")
            .Matches("[a-z]").WithMessage("Mật khẩu cần một chữ thường.")
            .Matches("[0-9]").WithMessage("Mật khẩu cần một chữ số.");
        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.NewPassword).WithMessage("Mật khẩu nhập lại chưa khớp.");
    }
}

public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().WithMessage("Nhập email.").EmailAddress().WithMessage("Email không hợp lệ.");
    }
}

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().WithMessage("Nhập email.").EmailAddress().WithMessage("Email không hợp lệ.");
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Nhập mật khẩu mới.")
            .MinimumLength(8).WithMessage("Mật khẩu tối thiểu 8 ký tự.")
            .Matches("[A-Z]").WithMessage("Mật khẩu cần một chữ hoa.")
            .Matches("[a-z]").WithMessage("Mật khẩu cần một chữ thường.")
            .Matches("[0-9]").WithMessage("Mật khẩu cần một chữ số.");
        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.NewPassword).WithMessage("Mật khẩu nhập lại chưa khớp.");
    }
}
