using DataLabeling.Application.DTOs.Projects;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Interfaces;

namespace DataLabeling.Application.Services;

/// <summary>
/// Service implementation for project CRUD operations with activity logging.
/// </summary>
public class ProjectService : IProjectService
{
    private readonly IUnitOfWork _uow;
    private readonly IActivityLogService _activityLog;

    public ProjectService(IUnitOfWork uow, IActivityLogService activityLog)
    {
        _uow = uow;
        _activityLog = activityLog;
    }

    public async Task<ProjectDto> CreateAsync(CreateProjectRequest request, int userId, CancellationToken cancellationToken = default)
    {
        var project = new Project
        {
            Name = request.Name,
            Description = request.Description,
            Type = request.Type,
            Status = ProjectStatus.Draft,
            Deadline = request.Deadline,
            CreatedById = userId
        };

        await _uow.Projects.AddAsync(project, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        // Create text guideline if content provided
        if (!string.IsNullOrWhiteSpace(request.GuidelineContent))
        {
            var guideline = new Guideline
            {
                ProjectId = project.Id,
                Content = request.GuidelineContent,
                Version = 1,
                UpdatedAt = DateTime.UtcNow
            };

            await _uow.Guidelines.AddAsync(guideline, cancellationToken);
            await _uow.SaveChangesAsync(cancellationToken);
        }

        await _activityLog.LogAsync(userId, ActivityAction.Create, "Project", project.Id,
            $"Created project '{project.Name}'", cancellationToken: cancellationToken);

        return new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Type = project.Type,
            Status = project.Status,
            Deadline = project.Deadline,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            TotalItems = 0,
            FinishedItems = 0
        };
    }

    public async Task UpdateAsync(int projectId, UpdateProjectRequest request, int userId, UserRole role, CancellationToken cancellationToken = default)
    {
        var project = await _uow.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found");

        if (project.CreatedById != userId && role != UserRole.Admin)
            throw new UnauthorizedAccessException("You do not have permission to update this project.");

        project.Name = request.Name;
        project.Description = request.Description;
        project.Deadline = request.Deadline;

        _uow.Projects.Update(project);
        await _uow.SaveChangesAsync(cancellationToken);

        await _activityLog.LogAsync(userId, ActivityAction.Update, "Project", project.Id,
            $"Updated project '{project.Name}'", cancellationToken: cancellationToken);
    }

    public async Task ChangeStatusAsync(int projectId, ProjectStatus newStatus, int userId, UserRole role, CancellationToken cancellationToken = default)
    {
        var project = await _uow.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found");

        if (project.CreatedById != userId && role != UserRole.Admin)
            throw new UnauthorizedAccessException("You do not have permission to change this project's status.");

        var oldStatus = project.Status;
        project.Status = newStatus;

        _uow.Projects.Update(project);
        await _uow.SaveChangesAsync(cancellationToken);

        await _activityLog.LogAsync(userId, ActivityAction.Update, "Project", project.Id,
            $"Changed project status from '{oldStatus}' to '{newStatus}'", cancellationToken: cancellationToken);
    }

    public async Task DeleteAsync(int projectId, int userId, UserRole role, CancellationToken cancellationToken = default)
    {
        var project = await _uow.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new KeyNotFoundException("Project not found");

        if (project.CreatedById != userId && role != UserRole.Admin)
            throw new UnauthorizedAccessException("You do not have permission to delete this project.");

        var projectName = project.Name;

        _uow.Projects.Delete(project);
        await _uow.SaveChangesAsync(cancellationToken);

        await _activityLog.LogAsync(userId, ActivityAction.Delete, "Project", projectId,
            $"Deleted project '{projectName}'", cancellationToken: cancellationToken);
    }
}
