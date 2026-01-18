namespace DataLabeling.Core.Enums;

/// <summary>
/// Type of labeling project.
/// </summary>
public enum ProjectType
{
    /// <summary>Image classification - assign label to entire image</summary>
    Classification = 1,

    /// <summary>Object detection - draw bounding boxes around objects</summary>
    ObjectDetection = 2,

    /// <summary>Image segmentation - draw polygons around objects</summary>
    Segmentation = 3
}
