using DataLabeling.Application.DTOs.Tasks;
using FluentValidation;

namespace DataLabeling.Application.Validators.Tasks;

/// <summary>
/// Validator for CreateTaskRequest.
/// </summary>
public class CreateTaskRequestValidator : AbstractValidator<CreateTaskRequest>
{
    public CreateTaskRequestValidator()
    {
        RuleFor(x => x.ProjectId)
            .GreaterThan(0).WithMessage("A valid project ID is required.");

        RuleFor(x => x.AnnotatorId)
            .GreaterThan(0).WithMessage("A valid annotator ID is required.");
    }
}
