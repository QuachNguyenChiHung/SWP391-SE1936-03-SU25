using AutoMapper;
using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.User;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces;
using DataLabeling.Core.Interfaces.Repositories;

namespace DataLabeling.Application.Services;

/// <summary>
/// Service for user management operations.
/// </summary>
public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UserService(
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    /// <inheritdoc/>
    public async Task<PagedResponse<UserDto>> GetAllAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? searchTerm = null,
        UserRole? role = null,
        UserStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var (users, totalCount) = await _userRepository.GetPagedAsync(
            pageNumber,
            pageSize,
            role,
            status,
            searchTerm,
            cancellationToken);

        var userDtos = _mapper.Map<IEnumerable<UserDto>>(users);

        return new PagedResponse<UserDto>(userDtos, totalCount, pageNumber, pageSize);
    }

    /// <inheritdoc/>
    public async Task<UserDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(id, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User", id);
        }

        return _mapper.Map<UserDto>(user);
    }

    /// <inheritdoc/>
    public async Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        // Check if email already exists
        if (await _userRepository.EmailExistsAsync(request.Email, cancellationToken))
        {
            throw new ConflictException($"A user with email '{request.Email}' already exists.");
        }

        var user = new User
        {
            Email = request.Email.ToLowerInvariant(),
            Name = request.Name,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role,
            Status = UserStatus.Active
        };

        await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<UserDto>(user);
    }

    /// <inheritdoc/>
    public async Task<UserDto> UpdateAsync(int id, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(id, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User", id);
        }

        // Update only provided fields
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            user.Name = request.Name;
        }

        if (request.Role.HasValue)
        {
            user.Role = request.Role.Value;
        }

        if (request.Status.HasValue)
        {
            user.Status = request.Status.Value;
        }

        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<UserDto>(user);
    }

    /// <inheritdoc/>
    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(id, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User", id);
        }

        // Soft delete by setting status to Inactive
        user.Status = UserStatus.Inactive;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
