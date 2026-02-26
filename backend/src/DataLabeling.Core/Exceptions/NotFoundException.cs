namespace DataLabeling.Core.Exceptions;

/// <summary>
/// Exception thrown when a requested resource is not found.
/// </summary>
public class NotFoundException : Exception
{
    /// <summary>
    /// Gets the name of the entity type that was not found.
    /// </summary>
    public string EntityName { get; }

    /// <summary>
    /// Gets the key used to search for the entity.
    /// </summary>
    public object? Key { get; }

    /// <summary>
    /// Initializes a new instance of the NotFoundException class.
    /// </summary>
    public NotFoundException()
        : base("The requested resource was not found.")
    {
        EntityName = "Resource";
    }

    /// <summary>
    /// Initializes a new instance of the NotFoundException class with a message.
    /// </summary>
    public NotFoundException(string message)
        : base(message)
    {
        EntityName = "Resource";
    }

    /// <summary>
    /// Initializes a new instance of the NotFoundException class with entity name and key.
    /// </summary>
    public NotFoundException(string entityName, object key)
        : base($"{entityName} with key '{key}' was not found.")
    {
        EntityName = entityName;
        Key = key;
    }

    /// <summary>
    /// Initializes a new instance of the NotFoundException class with a message and inner exception.
    /// </summary>
    public NotFoundException(string message, Exception innerException)
        : base(message, innerException)
    {
        EntityName = "Resource";
    }
}
