namespace DataLabeling.API.Services;

public interface IFileStorageService
{
    Task<(string FilePath, string FileName, long FileSize)> SaveFileAsync(
        IFormFile file,
        string folder,
        CancellationToken cancellationToken = default);

    Task DeleteFileAsync(string filePath);

    string GetFileUrl(string filePath);
}

public class FileStorageService : IFileStorageService
{
    private readonly string _rootPath;

    public FileStorageService(IWebHostEnvironment env)
    {
        _rootPath = Path.Combine(env.ContentRootPath, "uploads");

        if (!Directory.Exists(_rootPath))
        {
            Directory.CreateDirectory(_rootPath);
        }
    }

    public async Task<(string FilePath, string FileName, long FileSize)> SaveFileAsync(
        IFormFile file,
        string folder,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty");

        var folderPath = Path.Combine(_rootPath, folder);
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
        var fullPath = Path.Combine(_rootPath, filePath);
        if (File.Exists(fullPath))
        {
            await Task.Run(() => File.Delete(fullPath));
        }
    }

    public string GetFileUrl(string filePath)
    {
        return $"/uploads/{filePath}";
    }
}
