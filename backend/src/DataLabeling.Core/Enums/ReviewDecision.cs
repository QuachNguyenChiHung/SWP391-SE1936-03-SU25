namespace DataLabeling.Core.Enums;

/// <summary>
/// Review decision made by reviewer.
/// </summary>
public enum ReviewDecision
{
    /// <summary>Approved - annotations are correct</summary>
    Approved = 1,

    /// <summary>Rejected - annotations have errors, need revision</summary>
    Rejected = 2
}
