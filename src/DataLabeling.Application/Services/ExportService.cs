using System.IO.Compression;
using System.Text;
using System.Text.Json;
using System.Xml;
using DataLabeling.Application.DTOs.Export;
using DataLabeling.Application.Interfaces;
using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using DataLabeling.Core.Exceptions;
using DataLabeling.Core.Interfaces;

namespace DataLabeling.Application.Services;

/// <summary>
/// Service for exporting annotations in COCO, YOLO, and Pascal VOC formats.
/// </summary>
public class ExportService : IExportService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly string _uploadsRoot;
    private readonly string _exportsRoot;

    public ExportService(IUnitOfWork unitOfWork, string contentRootPath)
    {
        _unitOfWork = unitOfWork;
        _uploadsRoot = Path.Combine(contentRootPath, "uploads");
        _exportsRoot = Path.Combine(contentRootPath, "exports");

        if (!Directory.Exists(_exportsRoot))
        {
            Directory.CreateDirectory(_exportsRoot);
        }
    }

    public async Task<ExportResultDto> ExportProjectAsync(
        int projectId,
        ExportRequestDto request,
        CancellationToken cancellationToken = default)
    {
        // Validate project exists (includes Labels)
        var project = await _unitOfWork.Projects.GetWithDetailsAsync(projectId, cancellationToken);
        if (project == null)
            throw new NotFoundException("Project", projectId);

        // Get dataset and data items
        var dataset = await _unitOfWork.Datasets.GetByProjectIdAsync(projectId, cancellationToken);
        if (dataset == null)
            throw new NotFoundException("Dataset for project", projectId);

        // Get data items with annotations
        var dataItems = await GetDataItemsWithAnnotationsAsync(
            dataset.Id, request.StatusFilter, cancellationToken);

        if (!dataItems.Any())
        {
            throw new ValidationException("No data items found matching the filter criteria.");
        }

        // Generate export file name
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        var formatName = request.Format.ToString().ToLower();
        var fileName = $"project{projectId}_{formatName}_{timestamp}.zip";
        var zipPath = Path.Combine(_exportsRoot, fileName);

        int annotationCount = 0;

        // Create ZIP archive
        using (var zipArchive = ZipFile.Open(zipPath, ZipArchiveMode.Create))
        {
            switch (request.Format)
            {
                case ExportFormat.COCO:
                    annotationCount = await GenerateCocoExportAsync(
                        zipArchive, project, dataItems, request.IncludeImages, cancellationToken);
                    break;

                case ExportFormat.YOLO:
                    annotationCount = await GenerateYoloExportAsync(
                        zipArchive, project, dataItems, request.IncludeImages, cancellationToken);
                    break;

                case ExportFormat.PascalVOC:
                    annotationCount = await GeneratePascalVocExportAsync(
                        zipArchive, project, dataItems, request.IncludeImages, cancellationToken);
                    break;
            }
        }

        var fileInfo = new FileInfo(zipPath);

        return new ExportResultDto
        {
            DownloadUrl = $"/api/exports/{fileName}",
            FileName = fileName,
            FileSizeBytes = fileInfo.Length,
            ImageCount = dataItems.Count,
            AnnotationCount = annotationCount,
            Format = request.Format,
            CreatedAt = DateTime.UtcNow
        };
    }

    public Task<Stream> GetExportFileAsync(string fileName, CancellationToken cancellationToken = default)
    {
        var filePath = Path.Combine(_exportsRoot, fileName);
        if (!File.Exists(filePath))
            throw new NotFoundException("Export file", fileName);

        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult<Stream>(stream);
    }

    public bool ExportFileExists(string fileName)
    {
        var filePath = Path.Combine(_exportsRoot, fileName);
        return File.Exists(filePath);
    }

    public Task DeleteExportFileAsync(string fileName)
    {
        var filePath = Path.Combine(_exportsRoot, fileName);
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
        return Task.CompletedTask;
    }

    private async Task<List<DataItem>> GetDataItemsWithAnnotationsAsync(
        int datasetId,
        DataItemStatus? statusFilter,
        CancellationToken cancellationToken)
    {
        IEnumerable<DataItem> items;

        if (statusFilter.HasValue)
        {
            items = await _unitOfWork.DataItems.GetByDatasetAndStatusAsync(
                datasetId, statusFilter.Value, cancellationToken);
        }
        else
        {
            items = await _unitOfWork.DataItems.GetByDatasetIdAsync(datasetId, cancellationToken);
        }

        var result = new List<DataItem>();
        foreach (var item in items)
        {
            var detailedItem = await _unitOfWork.DataItems.GetWithDetailsAsync(item.Id, cancellationToken);
            if (detailedItem != null)
            {
                result.Add(detailedItem);
            }
        }

        return result;
    }

    #region COCO Format

    private async Task<int> GenerateCocoExportAsync(
        ZipArchive zipArchive,
        Project project,
        List<DataItem> dataItems,
        bool includeImages,
        CancellationToken cancellationToken)
    {
        var cocoData = new CocoDataset
        {
            Info = new CocoInfo
            {
                Description = project.Name,
                Version = "1.0",
                Year = DateTime.UtcNow.Year,
                DateCreated = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss")
            },
            Licenses = new List<CocoLicense>
            {
                new CocoLicense { Id = 1, Name = "Unknown", Url = "" }
            },
            Categories = new List<CocoCategory>(),
            Images = new List<CocoImage>(),
            Annotations = new List<CocoAnnotation>()
        };

        // Build categories from project labels
        var labelIdToCategory = new Dictionary<int, int>();
        int categoryId = 1;
        foreach (var label in project.Labels.OrderBy(l => l.DisplayOrder))
        {
            cocoData.Categories.Add(new CocoCategory
            {
                Id = categoryId,
                Name = label.Name,
                Supercategory = "object"
            });
            labelIdToCategory[label.Id] = categoryId;
            categoryId++;
        }

        // Build images and annotations
        int imageId = 1;
        int annotationId = 1;
        int totalAnnotations = 0;

        foreach (var dataItem in dataItems)
        {
            int width = dataItem.Width ?? 640;
            int height = dataItem.Height ?? 480;

            cocoData.Images.Add(new CocoImage
            {
                Id = imageId,
                FileName = dataItem.FileName,
                Width = width,
                Height = height,
                DateCaptured = dataItem.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                License = 1
            });

            // Add annotations for this image
            foreach (var annotation in dataItem.Annotations)
            {
                if (!labelIdToCategory.TryGetValue(annotation.LabelId, out int catId))
                    continue;

                var bbox = ParseBoundingBox(annotation.Coordinates);
                if (bbox == null)
                    continue;

                cocoData.Annotations.Add(new CocoAnnotation
                {
                    Id = annotationId,
                    ImageId = imageId,
                    CategoryId = catId,
                    Bbox = new[] { bbox.X, bbox.Y, bbox.Width, bbox.Height },
                    Area = bbox.Width * bbox.Height,
                    IsCrowd = 0
                });

                annotationId++;
                totalAnnotations++;
            }

            // Copy image if requested
            if (includeImages)
            {
                await AddImageToZipAsync(zipArchive, dataItem, "images/", cancellationToken);
            }

            imageId++;
        }

        // Write annotations.json
        var jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };
        var json = JsonSerializer.Serialize(cocoData, jsonOptions);
        var entry = zipArchive.CreateEntry("annotations.json");
        using (var writer = new StreamWriter(entry.Open(), Encoding.UTF8))
        {
            await writer.WriteAsync(json);
        }

        return totalAnnotations;
    }

    #endregion

    #region YOLO Format

    private async Task<int> GenerateYoloExportAsync(
        ZipArchive zipArchive,
        Project project,
        List<DataItem> dataItems,
        bool includeImages,
        CancellationToken cancellationToken)
    {
        // Build label index mapping
        var labelIdToIndex = new Dictionary<int, int>();
        var labelNames = new List<string>();
        int index = 0;
        foreach (var label in project.Labels.OrderBy(l => l.DisplayOrder))
        {
            labelIdToIndex[label.Id] = index;
            labelNames.Add(label.Name);
            index++;
        }

        int totalAnnotations = 0;

        // Generate label files for each image
        foreach (var dataItem in dataItems)
        {
            int width = dataItem.Width ?? 640;
            int height = dataItem.Height ?? 480;

            var sb = new StringBuilder();

            foreach (var annotation in dataItem.Annotations)
            {
                if (!labelIdToIndex.TryGetValue(annotation.LabelId, out int classIndex))
                    continue;

                var bbox = ParseBoundingBox(annotation.Coordinates);
                if (bbox == null)
                    continue;

                // Convert to YOLO format: class_id center_x center_y width height (normalized)
                double centerX = (bbox.X + bbox.Width / 2.0) / width;
                double centerY = (bbox.Y + bbox.Height / 2.0) / height;
                double normWidth = bbox.Width / (double)width;
                double normHeight = bbox.Height / (double)height;

                sb.AppendLine($"{classIndex} {centerX:F6} {centerY:F6} {normWidth:F6} {normHeight:F6}");
                totalAnnotations++;
            }

            // Write label file
            var labelFileName = Path.GetFileNameWithoutExtension(dataItem.FileName) + ".txt";
            var entry = zipArchive.CreateEntry($"labels/{labelFileName}");
            using (var writer = new StreamWriter(entry.Open(), Encoding.UTF8))
            {
                await writer.WriteAsync(sb.ToString());
            }

            // Copy image if requested
            if (includeImages)
            {
                await AddImageToZipAsync(zipArchive, dataItem, "images/", cancellationToken);
            }
        }

        // Write data.yaml
        var yamlContent = GenerateYoloDataYaml(project.Name, labelNames);
        var yamlEntry = zipArchive.CreateEntry("data.yaml");
        using (var writer = new StreamWriter(yamlEntry.Open(), Encoding.UTF8))
        {
            await writer.WriteAsync(yamlContent);
        }

        return totalAnnotations;
    }

    private string GenerateYoloDataYaml(string projectName, List<string> labelNames)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"# {projectName} - YOLO Dataset");
        sb.AppendLine($"# Exported from Data Labeling System");
        sb.AppendLine();
        sb.AppendLine("train: images");
        sb.AppendLine("val: images");
        sb.AppendLine();
        sb.AppendLine($"nc: {labelNames.Count}");
        sb.AppendLine($"names: [{string.Join(", ", labelNames.Select(n => $"'{n}'"))}]");
        return sb.ToString();
    }

    #endregion

    #region Pascal VOC Format

    private async Task<int> GeneratePascalVocExportAsync(
        ZipArchive zipArchive,
        Project project,
        List<DataItem> dataItems,
        bool includeImages,
        CancellationToken cancellationToken)
    {
        // Build label lookup
        var labelIdToName = project.Labels.ToDictionary(l => l.Id, l => l.Name);

        int totalAnnotations = 0;

        foreach (var dataItem in dataItems)
        {
            int width = dataItem.Width ?? 640;
            int height = dataItem.Height ?? 480;

            var xmlContent = GeneratePascalVocXml(dataItem, width, height, labelIdToName, ref totalAnnotations);

            // Write annotation XML
            var xmlFileName = Path.GetFileNameWithoutExtension(dataItem.FileName) + ".xml";
            var entry = zipArchive.CreateEntry($"Annotations/{xmlFileName}");
            using (var writer = new StreamWriter(entry.Open(), Encoding.UTF8))
            {
                await writer.WriteAsync(xmlContent);
            }

            // Copy image if requested
            if (includeImages)
            {
                await AddImageToZipAsync(zipArchive, dataItem, "JPEGImages/", cancellationToken);
            }
        }

        return totalAnnotations;
    }

    private string GeneratePascalVocXml(
        DataItem dataItem,
        int width,
        int height,
        Dictionary<int, string> labelIdToName,
        ref int totalAnnotations)
    {
        var settings = new XmlWriterSettings
        {
            Indent = true,
            IndentChars = "    ",
            Encoding = Encoding.UTF8
        };

        using var stringWriter = new StringWriter();
        using (var writer = XmlWriter.Create(stringWriter, settings))
        {
            writer.WriteStartDocument();
            writer.WriteStartElement("annotation");

            writer.WriteElementString("folder", "JPEGImages");
            writer.WriteElementString("filename", dataItem.FileName);
            writer.WriteElementString("path", $"JPEGImages/{dataItem.FileName}");

            // Source
            writer.WriteStartElement("source");
            writer.WriteElementString("database", "Data Labeling System");
            writer.WriteEndElement();

            // Size
            writer.WriteStartElement("size");
            writer.WriteElementString("width", width.ToString());
            writer.WriteElementString("height", height.ToString());
            writer.WriteElementString("depth", "3");
            writer.WriteEndElement();

            writer.WriteElementString("segmented", "0");

            // Objects
            foreach (var annotation in dataItem.Annotations)
            {
                if (!labelIdToName.TryGetValue(annotation.LabelId, out string? labelName))
                    continue;

                var bbox = ParseBoundingBox(annotation.Coordinates);
                if (bbox == null)
                    continue;

                writer.WriteStartElement("object");
                writer.WriteElementString("name", labelName);
                writer.WriteElementString("pose", "Unspecified");
                writer.WriteElementString("truncated", "0");
                writer.WriteElementString("difficult", "0");

                // Bndbox (Pascal VOC uses xmin, ymin, xmax, ymax)
                writer.WriteStartElement("bndbox");
                writer.WriteElementString("xmin", ((int)bbox.X).ToString());
                writer.WriteElementString("ymin", ((int)bbox.Y).ToString());
                writer.WriteElementString("xmax", ((int)(bbox.X + bbox.Width)).ToString());
                writer.WriteElementString("ymax", ((int)(bbox.Y + bbox.Height)).ToString());
                writer.WriteEndElement();

                writer.WriteEndElement(); // object
                totalAnnotations++;
            }

            writer.WriteEndElement(); // annotation
            writer.WriteEndDocument();
        }

        return stringWriter.ToString();
    }

    #endregion

    #region Helpers

    private async Task AddImageToZipAsync(
        ZipArchive zipArchive,
        DataItem dataItem,
        string targetFolder,
        CancellationToken cancellationToken)
    {
        var sourcePath = Path.Combine(_uploadsRoot, dataItem.FilePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
        if (!File.Exists(sourcePath))
            return;

        var entry = zipArchive.CreateEntry($"{targetFolder}{dataItem.FileName}");
        using var sourceStream = new FileStream(sourcePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        using var entryStream = entry.Open();
        await sourceStream.CopyToAsync(entryStream, cancellationToken);
    }

    private BoundingBox? ParseBoundingBox(string coordinates)
    {
        if (string.IsNullOrEmpty(coordinates))
            return null;

        try
        {
            using var doc = JsonDocument.Parse(coordinates);
            var root = doc.RootElement;

            // Check if it's a bbox type
            if (root.TryGetProperty("type", out var typeElement))
            {
                var type = typeElement.GetString();
                if (type != "bbox")
                    return null;
            }

            double x = 0, y = 0, width = 0, height = 0;

            if (root.TryGetProperty("x", out var xEl))
                x = xEl.GetDouble();
            if (root.TryGetProperty("y", out var yEl))
                y = yEl.GetDouble();
            if (root.TryGetProperty("width", out var wEl))
                width = wEl.GetDouble();
            if (root.TryGetProperty("height", out var hEl))
                height = hEl.GetDouble();

            return new BoundingBox { X = x, Y = y, Width = width, Height = height };
        }
        catch
        {
            return null;
        }
    }

    private class BoundingBox
    {
        public double X { get; set; }
        public double Y { get; set; }
        public double Width { get; set; }
        public double Height { get; set; }
    }

    #endregion

    #region COCO Model Classes

    private class CocoDataset
    {
        public CocoInfo Info { get; set; } = new();
        public List<CocoLicense> Licenses { get; set; } = new();
        public List<CocoImage> Images { get; set; } = new();
        public List<CocoAnnotation> Annotations { get; set; } = new();
        public List<CocoCategory> Categories { get; set; } = new();
    }

    private class CocoInfo
    {
        public string Description { get; set; } = "";
        public string Url { get; set; } = "";
        public string Version { get; set; } = "";
        public int Year { get; set; }
        public string Contributor { get; set; } = "Data Labeling System";
        public string DateCreated { get; set; } = "";
    }

    private class CocoLicense
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Url { get; set; } = "";
    }

    private class CocoImage
    {
        public int Id { get; set; }
        public string FileName { get; set; } = "";
        public int Width { get; set; }
        public int Height { get; set; }
        public string DateCaptured { get; set; } = "";
        public int License { get; set; }
    }

    private class CocoAnnotation
    {
        public int Id { get; set; }
        public int ImageId { get; set; }
        public int CategoryId { get; set; }
        public double[] Bbox { get; set; } = Array.Empty<double>();
        public double Area { get; set; }
        public int IsCrowd { get; set; }
    }

    private class CocoCategory
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Supercategory { get; set; } = "";
    }

    #endregion
}
