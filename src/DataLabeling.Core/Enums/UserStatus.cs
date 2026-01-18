namespace DataLabeling.Core.Enums;

/// <summary>
/// User account status.
/// </summary>
public enum UserStatus
{
    /// <summary>Active user - can login and use the system</summary>
    Active = 1,

    /// <summary>Inactive user - cannot login (soft delete)</summary>
    Inactive = 2
}
