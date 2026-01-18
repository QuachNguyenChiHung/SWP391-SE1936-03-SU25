namespace DataLabeling.Core.Exceptions;

/// <summary>
/// Exception thrown when a user does not have permission to perform an action.
/// </summary>
public class ForbiddenException : Exception
{
    /// <summary>
    /// Gets the action that was forbidden.
    /// </summary>
    public string? Action { get; }

    /// <summary>
    /// Gets the resource that access was denied to.
    /// </summary>
    public string? Resource { get; }

    /// <summary>
    /// Initializes a new instance of the ForbiddenException class.
    /// </summary>
    public ForbiddenException()
        : base("You do not have permission to perform this action.")
    {
    }

    /// <summary>
    /// Initializes a new instance of the ForbiddenException class with a message.
    /// </summary>
    public ForbiddenException(string message)
        : base(message)
    {
    }

    /// <summary>
    /// Initializes a new instance of the ForbiddenException class with action and resource.
    /// </summary>
    public ForbiddenException(string action, string resource)
        : base($"You do not have permission to {action} {resource}.")
    {
        Action = action;
        Resource = resource;
    }

    /// <summary>
    /// Initializes a new instance of the ForbiddenException class with a message and inner exception.
    /// </summary>
    public ForbiddenException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
