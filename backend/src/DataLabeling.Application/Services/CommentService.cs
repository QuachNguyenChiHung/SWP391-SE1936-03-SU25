using AutoMapper;
using DataLabeling.Application.DTOs.Comments;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces;

namespace DataLabeling.Application.Services;

/// <summary>
/// Service for comment operations.
/// </summary>
public class CommentService : ICommentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CommentService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<CommentDto>> GetCommentsByTaskItemIdAsync(
        int taskItemId,
        CancellationToken cancellationToken = default)
    {
        var comments = await _unitOfWork.Comments.GetCommentsByTaskItemIdAsync(taskItemId);
        var result = new List<CommentDto>();

        foreach (var comment in comments)
        {
            var author = await _unitOfWork.Users.GetByIdAsync(comment.AuthorId, cancellationToken);
            var dto = _mapper.Map<CommentDto>(comment);
            dto.AuthorName = author?.Name;
            result.Add(dto);
        }

        return result;
    }

    public async Task<CommentDto> AddCommentAsync(
        int taskItemId,
        int authorId,
        string content,
        CancellationToken cancellationToken = default)
    {
        // Validate task item exists
        var taskItem = await _unitOfWork.TaskItems.GetByIdAsync(taskItemId, cancellationToken);
        if (taskItem == null)
            throw new NotFoundException("TaskItem", taskItemId);

        // Validate author exists
        var author = await _unitOfWork.Users.GetByIdAsync(authorId, cancellationToken);
        if (author == null)
            throw new NotFoundException("User", authorId);

        // Create comment
        var comment = new Comment
        {
            TaskItemId = taskItemId,
            AuthorId = authorId,
            AuthorRole = author.Role,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Comments.AddAsync(comment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = _mapper.Map<CommentDto>(comment);
        dto.AuthorName = author.Name;
        return dto;
    }
}
