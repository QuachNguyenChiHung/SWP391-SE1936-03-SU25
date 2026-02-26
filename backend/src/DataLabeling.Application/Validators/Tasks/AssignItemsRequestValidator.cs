using DataLabeling.Application.DTOs.Tasks;
using FluentValidation;

namespace DataLabeling.Application.Validators.Tasks;

/// <summary>
/// Validator for AssignItemsRequest.
/// </summary>
public class AssignItemsRequestValidator : AbstractValidator<AssignItemsRequest>
{
    public AssignItemsRequestValidator()
    {
        RuleFor(x => x.DataItemIds)
            .NotEmpty().WithMessage("At least one data item ID is required.")
            .Must(ids => ids.All(id => id > 0)).WithMessage("All data item IDs must be valid positive integers.");
    }
}
