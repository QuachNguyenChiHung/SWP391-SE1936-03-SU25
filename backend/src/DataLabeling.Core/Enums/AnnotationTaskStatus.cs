namespace DataLabeling.Core.Enums;

/// <summary>
/// Status of an annotation task.
/// </summary>
public enum AnnotationTaskStatus
{
    /// <summary>Assigned - task created and assigned, not yet started</summary>
    Assigned = 1,

    /// <summary>InProgress - annotator is working on the task</summary>
    InProgress = 2,

    /// <summary>Submitted - all items completed, waiting for review</summary>
    Submitted = 3,

    /// <summary>Completed - all items approved by reviewer</summary>
    Completed = 4
}
