namespace DataLabeling.Application.DTOs.User;

/// <summary>
/// Request model for approving a user.
/// </summary>
public class ApproveUserRequest
{
    /// <summary>
    /// Optional notes about the approval.
    /// </summary>
    public string? Notes { get; set; }
}
