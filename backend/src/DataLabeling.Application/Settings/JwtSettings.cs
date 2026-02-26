namespace DataLabeling.Application.Settings;

/// <summary>
/// JWT configuration settings.
/// </summary>
public class JwtSettings
{
    /// <summary>
    /// Configuration section name.
    /// </summary>
    public const string SectionName = "JwtSettings";

    /// <summary>
    /// Secret key for signing tokens (minimum 32 characters).
    /// </summary>
    public required string SecretKey { get; set; }

    /// <summary>
    /// Token issuer.
    /// </summary>
    public required string Issuer { get; set; }

    /// <summary>
    /// Token audience.
    /// </summary>
    public required string Audience { get; set; }

    /// <summary>
    /// Token expiration time in minutes.
    /// </summary>
    public int ExpiryMinutes { get; set; } = 60;
}
