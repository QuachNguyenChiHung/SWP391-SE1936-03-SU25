using DataLabeling.Application.DTOs.Reviews;
using DataLabeling.Core.Enums;
using FluentValidation;

namespace DataLabeling.Application.Validators.Reviews;

/// <summary>
/// Validator for CreateReviewRequest.
/// </summary>
public class CreateReviewRequestValidator : AbstractValidator<CreateReviewRequest>
{
    public CreateReviewRequestValidator()
    {
        RuleFor(x => x.Decision)
            .IsInEnum().WithMessage("Invalid review decision. Must be Approved or Rejected.");

        RuleFor(x => x.Feedback)
            .NotEmpty().WithMessage("Feedback is required when rejecting an annotation.")
            .MaximumLength(2000).WithMessage("Feedback must not exceed 2000 characters.")
            .When(x => x.Decision == ReviewDecision.Rejected);

        RuleFor(x => x.ErrorTypeIds)
            .NotEmpty().WithMessage("At least one error type is required when rejecting an annotation.")
            .Must(ids => ids.All(id => id > 0)).WithMessage("All error type IDs must be valid positive integers.")
            .When(x => x.Decision == ReviewDecision.Rejected);
    }
}
