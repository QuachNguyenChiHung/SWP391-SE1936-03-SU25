using DataLabeling.Application.DTOs.Projects;
using DataLabeling.Core.Enums;

namespace DataLabeling.Application.Interfaces;

/// <summary>
/// Service interface for project CRUD operations.
/// </summary>
public interface IProjectService
{
    Task<ProjectDto> CreateAsync(CreateProjectRequest request, int userId, CancellationToken cancellationToken = default);

    Task UpdateAsync(int projectId, UpdateProjectRequest request, int userId, UserRole role, CancellationToken cancellationToken = default);

    Task ChangeStatusAsync(int projectId, ProjectStatus newStatus, int userId, UserRole role, CancellationToken cancellationToken = default);

    Task DeleteAsync(int projectId, int userId, UserRole role, CancellationToken cancellationToken = default);
}
