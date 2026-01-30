using AutoMapper;
using DataLabeling.Application.DTOs.Common;
using DataLabeling.Application.DTOs.DataItems;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces;
using Microsoft.AspNetCore.Http;

namespace DataLabeling.Application.Services;

/// <summary>
/// Service for DataItem and Dataset operations.
/// </summary>
public class DataItemService : IDataItemService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IFileStorageService _fileStorage;

    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp" };
    private const int MaxFileSizeMB = 10;

    public DataItemService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IFileStorageService fileStorage)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _fileStorage = fileStorage;
    }

    public async Task<DatasetDto> GetOrCreateDatasetAsync(int projectId, CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
            throw new NotFoundException("Project", projectId);

        var dataset = await _unitOfWork.Datasets.GetByProjectIdAsync(projectId, cancellationToken);

        if (dataset == null)
        {
            dataset = new Dataset
            {
                ProjectId = projectId,
                TotalItems = 0,
                TotalSizeMB = 0
            };

            await _unitOfWork.Datasets.AddAsync(dataset, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return _mapper.Map<DatasetDto>(dataset);
    }

    public async Task<DatasetDto?> GetDatasetByProjectIdAsync(int projectId, CancellationToken cancellationToken = default)
    {
        var dataset = await _unitOfWork.Datasets.GetByProjectIdAsync(projectId, cancellationToken);
        return dataset == null ? null : _mapper.Map<DatasetDto>(dataset);
    }

    public async Task DeleteDatasetAsync(int projectId, CancellationToken cancellationToken = default)
    {
        var dataset = await _unitOfWork.Datasets.GetWithDataItemsAsync(
            (await _unitOfWork.Datasets.GetByProjectIdAsync(projectId, cancellationToken))?.Id ?? 0,
            cancellationToken);

        if (dataset == null)
            throw new NotFoundException("Dataset for project", projectId);

        // Delete all files from storage
        foreach (var item in dataset.DataItems)
        {
            try
            {
                await _fileStorage.DeleteFileAsync(item.FilePath);
                if (!string.IsNullOrEmpty(item.ThumbnailPath))
                {
                    await _fileStorage.DeleteFileAsync(item.ThumbnailPath);
                }
            }
            catch
            {
                // Continue even if file deletion fails
            }
        }

        _unitOfWork.Datasets.Delete(dataset);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<UploadResultDto> UploadFilesAsync(int projectId, IFormFileCollection files, CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
            throw new NotFoundException("Project", projectId);

        // Get or create dataset
        var datasetDto = await GetOrCreateDatasetAsync(projectId, cancellationToken);
        var dataset = await _unitOfWork.Datasets.GetByIdAsync(datasetDto.Id, cancellationToken);

        var result = new UploadResultDto
        {
            Items = new List<DataItemDto>(),
            FailedFiles = new List<FailedFileDto>()
        };

        var uploadedItems = new List<DataItemDto>();
        var failedFiles = new List<FailedFileDto>();
        long totalBytes = 0;

        var folder = $"projects/{projectId}/images";

        foreach (var file in files)
        {
            try
            {
                // Validate file extension
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!AllowedExtensions.Contains(extension))
                {
                    failedFiles.Add(new FailedFileDto
                    {
                        FileName = file.FileName,
                        Reason = $"Invalid file type. Allowed: {string.Join(", ", AllowedExtensions)}"
                    });
                    continue;
                }

                // Validate file size
                if (file.Length > MaxFileSizeMB * 1024 * 1024)
                {
                    failedFiles.Add(new FailedFileDto
                    {
                        FileName = file.FileName,
                        Reason = $"File size exceeds {MaxFileSizeMB}MB limit"
                    });
                    continue;
                }

                // Save file with thumbnail
                var (filePath, thumbnailPath, originalName, fileSize, imageWidth, imageHeight) =
                    await _fileStorage.SaveImageWithThumbnailAsync(file, folder, 200, cancellationToken);

                var dataItem = new DataItem
                {
                    DatasetId = dataset!.Id,
                    FileName = originalName,
                    FilePath = filePath,
                    ThumbnailPath = thumbnailPath,
                    FileSizeKB = (int)(fileSize / 1024),
                    Width = imageWidth > 0 ? imageWidth : null,
                    Height = imageHeight > 0 ? imageHeight : null,
                    Status = DataItemStatus.Pending
                };

                await _unitOfWork.DataItems.AddAsync(dataItem, cancellationToken);
                totalBytes += fileSize;

                uploadedItems.Add(_mapper.Map<DataItemDto>(dataItem));
            }
            catch (Exception ex)
            {
                failedFiles.Add(new FailedFileDto
                {
                    FileName = file.FileName,
                    Reason = $"Upload failed: {ex.Message}"
                });
            }
        }

        // Save all items
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Update dataset statistics
        await _unitOfWork.Datasets.UpdateStatisticsAsync(dataset!.Id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        result.UploadedCount = uploadedItems.Count;
        result.FailedCount = failedFiles.Count;
        result.TotalSizeMB = Math.Round((decimal)totalBytes / (1024 * 1024), 2);
        result.Items = uploadedItems;
        result.FailedFiles = failedFiles;

        return result;
    }

    public async Task<PagedResult<DataItemDto>> GetDataItemsAsync(
        int projectId,
        int pageNumber,
        int pageSize,
        DataItemStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var dataset = await _unitOfWork.Datasets.GetByProjectIdAsync(projectId, cancellationToken);
        if (dataset == null)
        {
            return new PagedResult<DataItemDto>
            {
                Items = new List<DataItemDto>(),
                TotalCount = 0,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

        var (items, totalCount) = await _unitOfWork.DataItems.GetPagedAsync(
            dataset.Id, pageNumber, pageSize, status, cancellationToken);

        return new PagedResult<DataItemDto>
        {
            Items = _mapper.Map<IEnumerable<DataItemDto>>(items),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<DataItemDetailDto?> GetDataItemDetailAsync(int dataItemId, CancellationToken cancellationToken = default)
    {
        var dataItem = await _unitOfWork.DataItems.GetWithDetailsAsync(dataItemId, cancellationToken);
        if (dataItem == null)
            return null;

        var dto = _mapper.Map<DataItemDetailDto>(dataItem);

        // Map annotations with label info
        dto.Annotations = dataItem.Annotations.Select(a => new AnnotationDto
        {
            Id = a.Id,
            LabelId = a.LabelId,
            LabelName = a.Label?.Name ?? "",
            LabelColor = a.Label?.Color ?? "",
            Coordinates = a.Coordinates ?? "",
            CreatedAt = a.CreatedAt,
            CreatedById = a.CreatedById,
            CreatedByName = a.CreatedBy?.Name ?? ""
        }).ToList();

        // Map reviews with reviewer info
        dto.Reviews = dataItem.Reviews.Select(r => new ReviewDto
        {
            Id = r.Id,
            Decision = r.Decision.ToString(),
            Feedback = r.Feedback,
            CreatedAt = r.CreatedAt,
            ReviewerId = r.ReviewerId,
            ReviewerName = r.Reviewer?.Name ?? "",
            ErrorTypes = r.ReviewErrorTypes?.Select(ret => ret.ErrorType?.Name ?? "").ToList() ?? new List<string>()
        }).ToList();

        return dto;
    }

    public async Task UpdateStatusAsync(int dataItemId, DataItemStatus status, CancellationToken cancellationToken = default)
    {
        var dataItem = await _unitOfWork.DataItems.GetByIdAsync(dataItemId, cancellationToken);
        if (dataItem == null)
            throw new NotFoundException("DataItem", dataItemId);

        dataItem.Status = status;
        dataItem.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.DataItems.Update(dataItem);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task BulkUpdateStatusAsync(int[] ids, DataItemStatus status, CancellationToken cancellationToken = default)
    {
        await _unitOfWork.DataItems.BulkUpdateStatusAsync(ids, status, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteDataItemAsync(int dataItemId, CancellationToken cancellationToken = default)
    {
        var dataItem = await _unitOfWork.DataItems.GetByIdAsync(dataItemId, cancellationToken);
        if (dataItem == null)
            throw new NotFoundException("DataItem", dataItemId);

        var datasetId = dataItem.DatasetId;

        // Delete files from storage
        try
        {
            await _fileStorage.DeleteFileAsync(dataItem.FilePath);
            if (!string.IsNullOrEmpty(dataItem.ThumbnailPath))
            {
                await _fileStorage.DeleteFileAsync(dataItem.ThumbnailPath);
            }
        }
        catch
        {
            // Continue even if file deletion fails
        }

        _unitOfWork.DataItems.Delete(dataItem);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Update dataset statistics
        await _unitOfWork.Datasets.UpdateStatisticsAsync(datasetId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
