using DataLabeling.Application.DTOs.Comments;
using FluentValidation;

namespace DataLabeling.Application.Validators.Comments;

/// <summary>
/// Validator for AddCommentRequest.
/// </summary>
public class AddCommentRequestValidator : AbstractValidator<AddCommentRequest>
{
    public AddCommentRequestValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Comment content is required.")
            .MaximumLength(2000).WithMessage("Comment content must not exceed 2000 characters.");
    }
}
