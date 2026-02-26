using DataLabeling.Application.DTOs.Annotations;
using FluentValidation;
using System.Text.Json;

namespace DataLabeling.Application.Validators.Annotations;

/// <summary>
/// Validator for CreateAnnotationRequest.
/// </summary>
public class CreateAnnotationRequestValidator : AbstractValidator<CreateAnnotationRequest>
{
    private static readonly HashSet<string> ValidTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "bbox", "polygon", "classification"
    };

    public CreateAnnotationRequestValidator()
    {
        RuleFor(x => x.LabelId)
            .GreaterThan(0).WithMessage("A valid label ID is required.");

        RuleFor(x => x.Coordinates)
            .NotEmpty().WithMessage("Coordinates are required.")
            .Must(BeValidJson).WithMessage("Coordinates must be a valid JSON string.")
            .Must(HaveValidType).WithMessage("Coordinates must contain a valid 'type' field (bbox, polygon, or classification).");
    }

    private static bool BeValidJson(string coordinates)
    {
        try
        {
            using var doc = JsonDocument.Parse(coordinates);
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
