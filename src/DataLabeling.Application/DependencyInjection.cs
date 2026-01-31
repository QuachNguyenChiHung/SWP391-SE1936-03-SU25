using DataLabeling.Application.Interfaces;
using DataLabeling.Application.Mappings;
using DataLabeling.Application.Services;
using DataLabeling.Application.Settings;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DataLabeling.Application;

/// <summary>
/// Extension methods for registering Application layer services.
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Adds Application layer services to the dependency injection container.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">The configuration.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddApplication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Add AutoMapper
        services.AddAutoMapper(typeof(MappingProfile).Assembly);

        // Add FluentValidation
        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        // Add JWT Settings
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        // Add Email Settings
        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));

        // Add Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ILabelService, LabelService>();
        services.AddScoped<IDataItemService, DataItemService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<IAnnotationService, AnnotationService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<IActivityLogService, ActivityLogService>();

        return services;
    }
}
