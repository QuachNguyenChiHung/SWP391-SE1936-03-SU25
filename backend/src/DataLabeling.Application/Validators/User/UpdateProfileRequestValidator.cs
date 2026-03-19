using DataLabeling.Application.DTOs.User;
using FluentValidation;

namespace DataLabeling.Application.Validators.User;

/// <summary>
/// Validator for UpdateProfileRequest.
/// </summary>
public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MinimumLength(2).WithMessage("Name must be at least 2 characters long.")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters.");

        RuleFor(x => x.SpecializeIn)
            .MaximumLength(500).WithMessage("Specialization must not exceed 500 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.SpecializeIn));
    }
}
