namespace DataLabeling.API.Services;

/// <summary>
/// Service for file storage operations.
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

public class FileStorageService : IFileStorageService
{
    private readonly string _publicRoot;   // uploads/ - publicly accessible
    private readonly string _privateRoot;  // storage/ - requires authentication

    public FileStorageService(IWebHostEnvironment env)
    {
        _publicRoot = Path.Combine(env.ContentRootPath, "uploads");
        _privateRoot = Path.Combine(env.ContentRootPath, "storage");

        if (!Directory.Exists(_publicRoot))
        {
            Directory.CreateDirectory(_publicRoot);
        }

        if (!Directory.Exists(_privateRoot))
        {
            Directory.CreateDirectory(_privateRoot);
        }
    }

    public async Task<(string FilePath, string FileName, long FileSize)> SaveFileAsync(
        IFormFile file,
        string folder,
        CancellationToken cancellationToken = default)
    {
        return await SaveFileInternalAsync(file, folder, _publicRoot, cancellationToken);
    }

    public async Task<(string FilePath, string FileName, long FileSize)> SavePrivateFileAsync(
        IFormFile file,
        string folder,
        CancellationToken cancellationToken = default)
    {
        return await SaveFileInternalAsync(file, folder, _privateRoot, cancellationToken);
    }

    private async Task<(string FilePath, string FileName, long FileSize)> SaveFileInternalAsync(
        IFormFile file,
        string folder,
        string rootPath,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty");

        var folderPath = Path.Combine(rootPath, folder);
        if (!Directory.Exists(folderPath))
        {
            Directory.CreateDirectory(folderPath);
        }

        var fileExtension = Path.GetExtension(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var fullPath = Path.Combine(folderPath, uniqueFileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var relativePath = Path.Combine(folder, uniqueFileName).Replace("\\", "/");

        return (relativePath, file.FileName, file.Length);
    }

    public async Task DeleteFileAsync(string filePath)
    {
        await DeleteFileInternalAsync(filePath, _publicRoot);
    }

    public async Task DeletePrivateFileAsync(string filePath)
    {
        await DeleteFileInternalAsync(filePath, _privateRoot);
    }

    private async Task DeleteFileInternalAsync(string filePath, string rootPath)
    {
        if (string.IsNullOrEmpty(filePath)) return;

        var fullPath = Path.Combine(rootPath, filePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
        if (File.Exists(fullPath))
        {
            await Task.Run(() => File.Delete(fullPath));
        }
    }

    public string GetFileUrl(string filePath)
    {
        return $"/uploads/{filePath}";
    }

    public string GetPrivateFilePath(string filePath)
    {
        return Path.Combine(_privateRoot, filePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
    }

    public bool PrivateFileExists(string filePath)
    {
        if (string.IsNullOrEmpty(filePath)) return false;
        var fullPath = GetPrivateFilePath(filePath);
        return File.Exists(fullPath);
    }

    public Stream OpenPrivateFileRead(string filePath)
    {
        var fullPath = GetPrivateFilePath(filePath);
        return new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
    }
}
