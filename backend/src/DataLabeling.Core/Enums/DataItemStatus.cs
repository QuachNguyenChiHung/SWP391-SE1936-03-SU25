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

    /// <summary>Completed - annotator finished labeling this item</summary>
    Completed = 4,

    /// <summary>Submitted - annotator finished, waiting for review</summary>
    Submitted = 5,

    /// <summary>Approved - reviewer approved the annotations</summary>
    Approved = 6,

    /// <summary>Rejected - reviewer rejected, needs re-annotation</summary>
    Rejected = 7,

    /// <summary>InReview - assigned to a reviewer, locked for review</summary>
    InReview = 8,

    /// <summary>Reported - flagged by annotator as having issues (no suitable label, poor quality, etc.)</summary>
    Reported = 9,

    /// <summary>Resolved - manager resolved a reported issue, ready for re-assignment</summary>
    Resolved = 10
}
