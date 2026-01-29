using AutoMapper;
using DataLabeling.Application.DTOs.Label;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces;
using DataLabeling.Core.Interfaces.Repositories;

namespace DataLabeling.Application.Services;

/// <summary>
/// Service implementation for Label operations.
/// </summary>
public class LabelService : ILabelService
{
    private readonly ILabelRepository _labelRepository;
    private readonly IProjectRepository _projectRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public LabelService(
        ILabelRepository labelRepository,
        IProjectRepository projectRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _labelRepository = labelRepository;
        _projectRepository = projectRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<LabelDto>> GetByProjectIdAsync(int projectId, CancellationToken cancellationToken = default)
    {
        // Verify project exists
        var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
        {
            throw new NotFoundException("Project", projectId);
        }

        var labels = await _labelRepository.GetByProjectIdOrderedAsync(projectId, cancellationToken);
        return _mapper.Map<IEnumerable<LabelDto>>(labels);
    }

    /// <inheritdoc />
    public async Task<LabelDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var label = await _labelRepository.GetByIdAsync(id, cancellationToken);
        if (label == null)
        {
            throw new NotFoundException("Label", id);
        }

        return _mapper.Map<LabelDto>(label);
    }

    /// <inheritdoc />
    public async Task<LabelDto> CreateAsync(int projectId, CreateLabelRequest request, CancellationToken cancellationToken = default)
    {
        // Verify project exists
        var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
        {
            throw new NotFoundException("Project", projectId);
        }

        // Check for duplicate name in project
        if (await _labelRepository.NameExistsInProjectAsync(projectId, request.Name, null, cancellationToken))
        {
            throw new ConflictException("Label", "name", request.Name);
        }

        // Check for duplicate shortcut in project
        if (request.Shortcut.HasValue)
        {
            if (await _labelRepository.ShortcutExistsInProjectAsync(projectId, request.Shortcut.Value, null, cancellationToken))
            {
                throw new ConflictException("Label", "shortcut", request.Shortcut.Value);
            }
        }

        // Get next display order
        var displayOrder = await _labelRepository.GetNextDisplayOrderAsync(projectId, cancellationToken);

        // Create label
        var label = _mapper.Map<Label>(request);
        label.ProjectId = projectId;
        label.DisplayOrder = displayOrder;

        await _labelRepository.AddAsync(label, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<LabelDto>(label);
    }

    /// <inheritdoc />
    public async Task<LabelDto> UpdateAsync(int id, UpdateLabelRequest request, CancellationToken cancellationToken = default)
    {
        var label = await _labelRepository.GetByIdAsync(id, cancellationToken);
        if (label == null)
        {
            throw new NotFoundException("Label", id);
        }

        // Check for duplicate name in project (if name is being changed)
        if (!string.IsNullOrEmpty(request.Name) && request.Name != label.Name)
        {
            if (await _labelRepository.NameExistsInProjectAsync(label.ProjectId, request.Name, id, cancellationToken))
            {
                throw new ConflictException("Label", "name", request.Name);
            }
            label.Name = request.Name;
        }

        // Check for duplicate shortcut in project (if shortcut is being changed)
        if (request.Shortcut.HasValue && request.Shortcut != label.Shortcut)
        {
            if (await _labelRepository.ShortcutExistsInProjectAsync(label.ProjectId, request.Shortcut.Value, id, cancellationToken))
            {
                throw new ConflictException("Label", "shortcut", request.Shortcut.Value);
            }
            label.Shortcut = request.Shortcut;
        }

        // Update other fields if provided
        if (!string.IsNullOrEmpty(request.Color))
        {
            label.Color = request.Color;
        }

        if (request.Description != null)
        {
            label.Description = request.Description;
        }

        if (request.DisplayOrder.HasValue)
        {
            label.DisplayOrder = request.DisplayOrder.Value;
        }

        label.UpdatedAt = DateTime.UtcNow;

        _labelRepository.Update(label);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<LabelDto>(label);
    }

    /// <inheritdoc />
    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var label = await _labelRepository.GetByIdAsync(id, cancellationToken);
        if (label == null)
        {
            throw new NotFoundException("Label", id);
        }

        // Check if label has any annotations
        if (await _labelRepository.HasAnnotationsAsync(id, cancellationToken))
        {
            throw new ConflictException("Cannot delete label that has existing annotations.");
        }

        _labelRepository.Delete(label);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task ReorderAsync(int projectId, int[] labelIds, CancellationToken cancellationToken = default)
    {
        // Verify project exists
        var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
        {
            throw new NotFoundException("Project", projectId);
        }

        // Get all labels for the project
        var labels = (await _labelRepository.GetByProjectIdAsync(projectId, cancellationToken)).ToList();

        // Verify all label IDs belong to the project
        var projectLabelIds = labels.Select(l => l.Id).ToHashSet();
        var providedIds = labelIds.ToHashSet();

        if (!projectLabelIds.SetEquals(providedIds))
        {
            throw new ValidationException("Label IDs must contain all labels for the project and no labels from other projects.");
        }

        // Update display order
        for (int i = 0; i < labelIds.Length; i++)
        {
            var label = labels.First(l => l.Id == labelIds[i]);
            label.DisplayOrder = i;
            label.UpdatedAt = DateTime.UtcNow;
            _labelRepository.Update(label);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
