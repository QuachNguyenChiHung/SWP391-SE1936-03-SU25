namespace DataLabeling.Application.DTOs.User;

/// <summary>
/// Request model for rejecting a user.
/// </summary>
public class RejectUserRequest
{
    /// <summary>
    /// Reason for rejection (required).
    /// </summary>
    public required string Reason { get; set; }
}
