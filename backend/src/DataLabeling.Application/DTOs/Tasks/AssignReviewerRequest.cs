namespace DataLabeling.Application.DTOs.Tasks;

/// <summary>
/// Request DTO for assigning a reviewer to a task.
/// </summary>
public class AssignReviewerRequest
{
    /// <summary>
    /// The reviewer's user ID.
    /// </summary>
    public int ReviewerId { get; set; }
}
