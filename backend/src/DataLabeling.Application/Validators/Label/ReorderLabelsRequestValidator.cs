using DataLabeling.Application.DTOs.Label;
using FluentValidation;

namespace DataLabeling.Application.Validators.Label;

/// <summary>
/// Validator for ReorderLabelsRequest.
/// </summary>
public class ReorderLabelsRequestValidator : AbstractValidator<ReorderLabelsRequest>
{
    public ReorderLabelsRequestValidator()
    {
        RuleFor(x => x.LabelIds)
            .NotEmpty().WithMessage("Label IDs are required.")
            .Must(HaveNoDuplicates).WithMessage("Label IDs must not contain duplicates.");
    }

    private static bool HaveNoDuplicates(int[] labelIds)
    {
        return labelIds.Distinct().Count() == labelIds.Length;
    }
}
