namespace DataLabeling.Core.Enums;

/// <summary>
/// Status of a task item (individual item within a task).
/// </summary>
public enum TaskItemStatus
{
    /// <summary>Assigned - item assigned but not started</summary>
    Assigned = 1,

    /// <summary>InProgress - annotator is working on this item</summary>
    InProgress = 2,

    /// <summary>Completed - annotator finished labeling this item</summary>
    Completed = 3,

    /// <summary>Submitted - item submitted for review (part of task submission)</summary>
    Submitted = 4,

    /// <summary>Approved - reviewer approved this item</summary>
    Approved = 5,

    /// <summary>Rejected - item rejected by reviewer and needs rework</summary>
    Rejected = 6,

    /// <summary>Flagged - item flagged by annotator as having no suitable label or other issues</summary>
    Flagged = 7
}
