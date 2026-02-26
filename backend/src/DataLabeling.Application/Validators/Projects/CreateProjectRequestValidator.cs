using DataLabeling.Application.DTOs.Projects;
using FluentValidation;

namespace DataLabeling.Application.Validators.Projects;

/// <summary>
/// Validator for CreateProjectRequest.
/// </summary>
public class CreateProjectRequestValidator : AbstractValidator<CreateProjectRequest>
{
    public CreateProjectRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Project name is required.")
            .MinimumLength(3).WithMessage("Project name must be at least 3 characters long.")
            .MaximumLength(255).WithMessage("Project name must not exceed 255 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Invalid project type specified.");

        RuleFor(x => x.Deadline)
            .GreaterThan(DateOnly.FromDateTime(DateTime.Today))
            .When(x => x.Deadline.HasValue)
            .WithMessage("Deadline must be a future date.");
    }
}
