using DataLabeling.Application.DTOs.Auth;
using FluentValidation;

namespace DataLabeling.Application.Validators.Auth;

/// <summary>
/// Validator for VerifyEmailRequest.
/// </summary>
public class VerifyEmailRequestValidator : AbstractValidator<VerifyEmailRequest>
{
    public VerifyEmailRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Verification token is required.");
    }
}
