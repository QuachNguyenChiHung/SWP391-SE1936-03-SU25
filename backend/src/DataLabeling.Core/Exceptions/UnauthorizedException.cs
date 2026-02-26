namespace DataLabeling.Core.Exceptions;

/// <summary>
/// Exception thrown when authentication fails or credentials are invalid.
/// </summary>
public class UnauthorizedException : Exception
{
    /// <summary>
    /// Initializes a new instance of the UnauthorizedException class.
    /// </summary>
    public UnauthorizedException()
        : base("Authentication is required to access this resource.")
    {
    }

    /// <summary>
    /// Initializes a new instance of the UnauthorizedException class with a message.
    /// </summary>
    public UnauthorizedException(string message)
        : base(message)
    {
    }

    /// <summary>
    /// Initializes a new instance of the UnauthorizedException class with a message and inner exception.
    /// </summary>
    public UnauthorizedException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
