namespace DataLabeling.Core.Exceptions;

/// <summary>
/// Exception thrown when there is a conflict with the current state of a resource.
/// </summary>
public class ConflictException : Exception
{
    /// <summary>
    /// Gets the name of the entity type that has a conflict.
    /// </summary>
    public string? EntityName { get; }

    /// <summary>
    /// Gets the field that caused the conflict.
    /// </summary>
    public string? ConflictField { get; }

    /// <summary>
    /// Initializes a new instance of the ConflictException class.
    /// </summary>
    public ConflictException()
        : base("A conflict occurred with the current state of the resource.")
    {
    }

    /// <summary>
    /// Initializes a new instance of the ConflictException class with a message.
    /// </summary>
    public ConflictException(string message)
        : base(message)
    {
    }

    /// <summary>
    /// Initializes a new instance of the ConflictException class for duplicate entities.
    /// </summary>
    public ConflictException(string entityName, string conflictField, object conflictValue)
        : base($"{entityName} with {conflictField} '{conflictValue}' already exists.")
    {
        EntityName = entityName;
        ConflictField = conflictField;
    }

    /// <summary>
    /// Initializes a new instance of the ConflictException class with a message and inner exception.
    /// </summary>
    public ConflictException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
