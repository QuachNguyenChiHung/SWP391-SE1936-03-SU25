namespace DataLabeling.Core.Enums;

/// <summary>
/// User roles in the system.
/// </summary>
public enum UserRole
{
    /// <summary>System administrator - full access</summary>
    Admin = 1,

    /// <summary>Project manager - can create projects, assign tasks</summary>
    Manager = 2,

    /// <summary>Annotator - can label images</summary>
    Annotator = 3,

    /// <summary>Reviewer - can review and approve/reject annotations</summary>
    Reviewer = 4
}
