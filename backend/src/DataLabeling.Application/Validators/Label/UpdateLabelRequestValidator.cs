using DataLabeling.Application.DTOs.Label;
using FluentValidation;

namespace DataLabeling.Application.Validators.Label;

/// <summary>
/// Validator for UpdateLabelRequest.
/// </summary>
public class UpdateLabelRequestValidator : AbstractValidator<UpdateLabelRequest>
{
    public UpdateLabelRequestValidator()
    {
        RuleFor(x => x.Name)
            .MinimumLength(1).WithMessage("Label name must be at least 1 character long.")
            .MaximumLength(100).WithMessage("Label name must not exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.Name));

        RuleFor(x => x.Color)
            .Matches(@"^#[0-9A-Fa-f]{6}$").WithMessage("Color must be in hex format (#RRGGBB).")
            .When(x => !string.IsNullOrEmpty(x.Color));

        RuleFor(x => x.Shortcut)
            .Must(BeValidShortcut)
            .When(x => x.Shortcut.HasValue)
            .WithMessage("Shortcut must be a single character (A-Z or 0-9).");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order must be non-negative.")
            .When(x => x.DisplayOrder.HasValue);
    }

    private static bool BeValidShortcut(char? shortcut)
    {
        if (!shortcut.HasValue) return true;
        var c = char.ToUpper(shortcut.Value);
        return (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9');
    }
}
