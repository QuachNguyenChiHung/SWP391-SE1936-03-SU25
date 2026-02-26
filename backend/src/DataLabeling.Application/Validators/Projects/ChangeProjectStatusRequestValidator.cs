using DataLabeling.Application.DTOs.Projects;
using FluentValidation;

namespace DataLabeling.Application.Validators.Projects;

/// <summary>
/// Validator for ChangeProjectStatusRequest.
/// </summary>
public class ChangeProjectStatusRequestValidator : AbstractValidator<ChangeProjectStatusRequest>
{
    public ChangeProjectStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid project status specified.");
    }
}
