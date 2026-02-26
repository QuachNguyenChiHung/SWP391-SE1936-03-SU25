using DataLabeling.Application.DTOs.Auth;
using FluentValidation;

namespace DataLabeling.Application.Validators.Auth;

/// <summary>
/// Validator for ResendVerificationRequest.
/// </summary>
public class ResendVerificationRequestValidator : AbstractValidator<ResendVerificationRequest>
{
    public ResendVerificationRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");
    }
}
