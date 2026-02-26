namespace DataLabeling.Core.Enums;

/// <summary>
/// Supported export formats for annotations.
/// </summary>
public enum ExportFormat
{
    /// <summary>
    /// COCO format - single JSON file with all annotations.
    /// Standard format for object detection benchmarks.
    /// </summary>
    COCO = 1,

    /// <summary>
    /// YOLO format - one TXT file per image with normalized coordinates.
    /// Used for YOLOv5/v8 training.
    /// </summary>
    YOLO = 2,

    /// <summary>
    /// Pascal VOC format - one XML file per image.
    /// Legacy format used in academic research.
    /// </summary>
    PascalVOC = 3
}
