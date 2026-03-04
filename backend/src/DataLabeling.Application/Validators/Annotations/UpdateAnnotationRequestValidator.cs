using DataLabeling.Application.DTOs.Annotations;
using FluentValidation;
using System.Text.Json;

namespace DataLabeling.Application.Validators.Annotations;

/// <summary>
/// Validator for UpdateAnnotationRequest.
/// </summary>
public class UpdateAnnotationRequestValidator : AbstractValidator<UpdateAnnotationRequest>
{
    private static readonly HashSet<string> ValidTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "bbox", "polygon", "classification"
    };

    public UpdateAnnotationRequestValidator()
    {
        RuleFor(x => x.LabelId)
            .GreaterThan(0).WithMessage("A valid label ID is required.")
            .When(x => x.LabelId != null);

        RuleFor(x => x.Coordinates)
            .Must(BeValidJson!).WithMessage("Coordinates must be a valid JSON string.")
            .Must(HaveValidType!).WithMessage("Coordinates must contain a valid 'type' field (bbox, polygon, or classification).")
            .When(x => x.Coordinates != null);

        RuleFor(x => x.Attributes)
            .Must(BeValidJson!).WithMessage("Attributes must be a valid JSON string.")
            .When(x => x.Attributes != null);
    }

    private static bool BeValidJson(string value)
    {
        try
        {
            using var doc = JsonDocument.Parse(value);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static bool HaveValidType(string coordinates)
    {
        try
        {
            using var doc = JsonDocument.Parse(coordinates);
            if (doc.RootElement.TryGetProperty("type", out var typeElement))
            {
                var type = typeElement.GetString();
                return type != null && ValidTypes.Contains(type);
            }
            return false;
        }
        catch
        {
            return false;
        }
    }
}
