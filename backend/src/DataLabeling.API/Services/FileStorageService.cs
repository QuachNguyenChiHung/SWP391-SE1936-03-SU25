using DataLabeling.Application.Interfaces;
using SkiaSharp;

namespace DataLabeling.API.Services;

/// <summary>
/// Implementation of file storage service.
/// </summary>
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

    public async Task<(string FilePath, string ThumbnailPath, string FileName, long FileSize, int Width, int Height)> SaveImageWithThumbnailAsync(
        IFormFile file,
        string folder,
        int maxThumbnailSize = 200,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty");

        var folderPath = Path.Combine(_publicRoot, folder);
        var thumbnailFolder = Path.Combine(folderPath, "thumbnails");

        if (!Directory.Exists(folderPath))
        {
            Directory.CreateDirectory(folderPath);
        }

        if (!Directory.Exists(thumbnailFolder))
        {
            Directory.CreateDirectory(thumbnailFolder);
        }

        var fileExtension = Path.GetExtension(file.FileName);
        var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
        var fullPath = Path.Combine(folderPath, uniqueFileName);
        var thumbnailFileName = $"{Path.GetFileNameWithoutExtension(uniqueFileName)}_thumb.jpg";
        var thumbnailFullPath = Path.Combine(thumbnailFolder, thumbnailFileName);

        // Save original file
        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        // Get image dimensions and generate thumbnail
        int width = 0, height = 0;
        try
        {
            (width, height) = await Task.Run(() => GenerateThumbnailAndGetDimensions(fullPath, thumbnailFullPath, maxThumbnailSize), cancellationToken);
        }
        catch
        {
            // If thumbnail generation fails, continue without thumbnail
        }

        var relativePath = Path.Combine(folder, uniqueFileName).Replace("\\", "/");
        var thumbnailRelativePath = File.Exists(thumbnailFullPath)
            ? Path.Combine(folder, "thumbnails", thumbnailFileName).Replace("\\", "/")
            : null;

        return (relativePath, thumbnailRelativePath!, file.FileName, file.Length, width, height);
    }

    private (int Width, int Height) GenerateThumbnailAndGetDimensions(string sourcePath, string thumbnailPath, int maxSize)
    {
        using var inputStream = File.OpenRead(sourcePath);
        using var original = SKBitmap.Decode(inputStream);

        if (original == null)
            return (0, 0);

        int originalWidth = original.Width;
        int originalHeight = original.Height;

        // Calculate thumbnail dimensions maintaining aspect ratio
        int width, height;
        if (original.Width > original.Height)
        {
            width = maxSize;
            height = (int)((float)original.Height / original.Width * maxSize);
        }
        else
        {
            height = maxSize;
            width = (int)((float)original.Width / original.Height * maxSize);
        }

        // Ensure minimum dimensions
        width = Math.Max(1, width);
        height = Math.Max(1, height);

        using var resized = original.Resize(new SKImageInfo(width, height), new SKSamplingOptions(SKFilterMode.Linear, SKMipmapMode.Linear));
        if (resized != null)
        {
            using var image = SKImage.FromBitmap(resized);
            using var data = image.Encode(SKEncodedImageFormat.Jpeg, 80);
            using var outputStream = File.OpenWrite(thumbnailPath);
            data.SaveTo(outputStream);
        }

        return (originalWidth, originalHeight);
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
