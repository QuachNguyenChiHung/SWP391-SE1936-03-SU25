using DataLabeling.Application.DTOs.User;
using FluentValidation;

namespace DataLabeling.Application.Validators.User;

/// <summary>
/// Validator for UpdateUserRequest.
/// </summary>
public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.Name)
            .MinimumLength(2).WithMessage("Name must be at least 2 characters long.")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.Name));

        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("Invalid role specified.")
            .When(x => x.Role.HasValue);

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid status specified.")
            .When(x => x.Status.HasValue);
    }
}
