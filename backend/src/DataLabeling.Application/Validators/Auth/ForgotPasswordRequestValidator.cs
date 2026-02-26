using DataLabeling.Application.DTOs.Auth;
using FluentValidation;

namespace DataLabeling.Application.Validators.Auth;

/// <summary>
/// Validator for ForgotPasswordRequest.
/// </summary>
public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(255).WithMessage("Email must not exceed 255 characters.");
    }
}
