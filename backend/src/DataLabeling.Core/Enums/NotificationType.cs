namespace DataLabeling.Core.Enums;

/// <summary>
/// Types of notifications in the system.
/// </summary>
public enum NotificationType
{
    /// <summary>New task has been assigned to annotator</summary>
    TaskAssigned = 1,

    /// <summary>Annotation was approved by reviewer</summary>
    ItemApproved = 2,

    /// <summary>Annotation was rejected by reviewer</summary>
    ItemRejected = 3,

    /// <summary>Project status changed to Active</summary>
    ProjectPublished = 4,

    /// <summary>Project deadline is approaching (3 days)</summary>
    DeadlineReminder = 5
}
