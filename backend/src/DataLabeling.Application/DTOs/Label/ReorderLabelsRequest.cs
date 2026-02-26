namespace DataLabeling.Application.DTOs.Label;

/// <summary>
/// Request model for reordering labels.
/// </summary>
public class ReorderLabelsRequest
{
    /// <summary>
    /// Array of label IDs in the desired order.
    /// All labels in the project must be included.
    /// </summary>
    public int[] LabelIds { get; set; } = Array.Empty<int>();
}
