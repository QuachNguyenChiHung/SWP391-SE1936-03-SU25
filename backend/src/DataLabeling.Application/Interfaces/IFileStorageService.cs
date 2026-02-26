using Microsoft.AspNetCore.Http;

namespace DataLabeling.Application.Interfaces;

/// <summary>
/// Service interface for file storage operations.
/// Supports both public (uploads/) and private (storage/) folders.
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// Saves a file to the public uploads folder.
    /// Files here are accessible via /uploads/{path} URL.
    /// Use for: images, thumbnails, public assets.
    /// </summary>
    Task<(string FilePath, string FileName, long FileSize)> SaveFileAsync(
        IFormFile file,
        string folder,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Saves an image file with thumbnail generation.
    /// Returns the main image path, thumbnail path, and image dimensions.
    /// </summary>
    Task<(string FilePath, string ThumbnailPath, string FileName, long FileSize, int Width, int Height)> SaveImageWithThumbnailAsync(
        IFormFile file,
        string folder,
        int maxThumbnailSize = 200,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Saves a file to the private storage folder.
    /// Files here are NOT publicly accessible - must be served through controller.
    /// Use for: guidelines, sensitive documents.
    /// </summary>
    Task<(string FilePath, string FileName, long FileSize)> SavePrivateFileAsync(
        IFormFile file,
        string folder,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a file from public uploads folder.
    /// </summary>
    Task DeleteFileAsync(string filePath);

    /// <summary>
    /// Deletes a file from private storage folder.
    /// </summary>
    Task DeletePrivateFileAsync(string filePath);

    /// <summary>
    /// Gets the public URL for a file in uploads folder.
    /// </summary>
    string GetFileUrl(string filePath);

    /// <summary>
    /// Gets the full file path for a private file (for streaming through controller).
    /// </summary>
    string GetPrivateFilePath(string filePath);

    /// <summary>
    /// Checks if a private file exists.
    /// </summary>
    bool PrivateFileExists(string filePath);

    /// <summary>
    /// Opens a read stream for a private file.
    /// </summary>
    Stream OpenPrivateFileRead(string filePath);
}
