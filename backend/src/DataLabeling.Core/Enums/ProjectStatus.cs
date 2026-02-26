namespace DataLabeling.Core.Enums;

/// <summary>
/// Project lifecycle status.
/// </summary>
public enum ProjectStatus
{
    /// <summary>Draft - project is being set up, not yet active</summary>
    Draft = 1,

    /// <summary>Active - project is in progress, tasks can be assigned</summary>
    Active = 2,

    /// <summary>Completed - all items have been labeled and approved</summary>
    Completed = 3,

    /// <summary>Archived - project is closed and read-only</summary>
    Archived = 4
}
