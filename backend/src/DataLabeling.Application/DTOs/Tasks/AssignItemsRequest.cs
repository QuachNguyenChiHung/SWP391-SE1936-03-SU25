namespace DataLabeling.Application.DTOs.Tasks;

/// <summary>
/// Request DTO for assigning additional items to an existing task.
/// </summary>
public class AssignItemsRequest
{
    /// <summary>
    /// List of data item IDs to add to the task.
    /// </summary>
    public int[] DataItemIds { get; set; } = Array.Empty<int>();
}
