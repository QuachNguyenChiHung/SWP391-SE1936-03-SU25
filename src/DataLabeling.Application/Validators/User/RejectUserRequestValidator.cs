using DataLabeling.Application.DTOs.User;
using FluentValidation;

namespace DataLabeling.Application.Validators.User;

/// <summary>
/// Validator for RejectUserRequest.
/// </summary>
public class RejectUserRequestValidator : AbstractValidator<RejectUserRequest>
{
    public RejectUserRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Rejection reason is required.")
            .MinimumLength(10).WithMessage("Rejection reason must be at least 10 characters long.")
            .MaximumLength(500).WithMessage("Rejection reason must not exceed 500 characters.");
    }
}
