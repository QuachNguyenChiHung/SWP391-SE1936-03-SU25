namespace DataLabeling.Core.Enums;

/// <summary>
/// Types of actions logged in activity log.
/// </summary>
public enum ActivityAction
{
    /// <summary>Entity was created</summary>
    Create = 1,

    /// <summary>Entity was updated</summary>
    Update = 2,

    /// <summary>Entity was deleted</summary>
    Delete = 3,

    /// <summary>Task/Item was submitted for review</summary>
    Submit = 4,

    /// <summary>Item was approved</summary>
    Approve = 5,

    /// <summary>Item was rejected</summary>
    Reject = 6,

    /// <summary>Task was assigned to annotator</summary>
    Assign = 7,

    /// <summary>User logged in</summary>
    Login = 8,

    /// <summary>User logged out</summary>
    Logout = 9
}
