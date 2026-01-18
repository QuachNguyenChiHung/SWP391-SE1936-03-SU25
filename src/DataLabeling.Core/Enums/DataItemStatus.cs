namespace DataLabeling.Core.Enums;

/// <summary>
/// Status of a data item (image) in the labeling workflow.
/// </summary>
public enum DataItemStatus
{
    /// <summary>Pending - not yet assigned to any annotator</summary>
    Pending = 1,

    /// <summary>Assigned - assigned to an annotator but not started</summary>
    Assigned = 2,

    /// <summary>InProgress - annotator is working on it</summary>
    InProgress = 3,

    /// <summary>Submitted - annotator finished, waiting for review</summary>
    Submitted = 4,

    /// <summary>Approved - reviewer approved the annotations</summary>
    Approved = 5,

    /// <summary>Rejected - reviewer rejected, needs re-annotation</summary>
    Rejected = 6
}
