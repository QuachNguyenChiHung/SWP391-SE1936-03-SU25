using System.Net;
using System.Text.Json;
using DataLabeling.Application.DTOs.Common;
using DataLabeling.Core.Exceptions;
using FluentValidation;

namespace DataLabeling.API.Middlewares;

/// <summary>
/// Middleware for handling exceptions globally.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, response) = exception switch
        {
            NotFoundException ex => (
                HttpStatusCode.NotFound,
                ApiResponse.FailureResponse(ex.Message)
            ),

            UnauthorizedException ex => (
                HttpStatusCode.Unauthorized,
                ApiResponse.FailureResponse(ex.Message)
            ),

            ForbiddenException ex => (
                HttpStatusCode.Forbidden,
                ApiResponse.FailureResponse(ex.Message)
            ),

            ConflictException ex => (
                HttpStatusCode.Conflict,
                ApiResponse.FailureResponse(ex.Message)
            ),

            Core.Exceptions.ValidationException ex => (
                HttpStatusCode.BadRequest,
                ApiResponse.FailureResponse(
                    ex.Message,
                    ex.Errors.SelectMany(e => e.Value).ToList()
                )
            ),

            FluentValidation.ValidationException ex => (
                HttpStatusCode.BadRequest,
                ApiResponse.FailureResponse(
                    "One or more validation errors occurred.",
                    ex.Errors.Select(e => e.ErrorMessage).ToList()
                )
            ),

            _ => (
                HttpStatusCode.InternalServerError,
                ApiResponse.FailureResponse("An unexpected error occurred.")
            )
        };

        // Log the exception
        if (statusCode == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(exception, "An unhandled exception occurred: {Message}", exception.Message);
        }
        else
        {
            _logger.LogWarning("A handled exception occurred: {ExceptionType} - {Message}",
                exception.GetType().Name, exception.Message);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var json = JsonSerializer.Serialize(response, options);
        await context.Response.WriteAsync(json);
    }
}

/// <summary>
/// Extension methods for ExceptionHandlingMiddleware.
/// </summary>
public static class ExceptionHandlingMiddlewareExtensions
{
    /// <summary>
    /// Adds the exception handling middleware to the application pipeline.
    /// </summary>
    public static IApplicationBuilder UseExceptionHandling(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ExceptionHandlingMiddleware>();
    }
}
