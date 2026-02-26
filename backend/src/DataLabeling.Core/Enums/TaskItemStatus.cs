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
    Completed = 3
}
