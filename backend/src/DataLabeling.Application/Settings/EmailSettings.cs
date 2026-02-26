namespace DataLabeling.Application.Settings;

/// <summary>
/// SMTP email configuration settings.
/// </summary>
public class EmailSettings
{
    public const string SectionName = "EmailSettings";

    /// <summary>
    /// SMTP server hostname.
    /// </summary>
    public string SmtpHost { get; set; } = string.Empty;

    /// <summary>
    /// SMTP server port (typically 587 for TLS, 465 for SSL).
    /// </summary>
    public int SmtpPort { get; set; } = 587;

    /// <summary>
    /// Sender email address.
    /// </summary>
    public string SenderEmail { get; set; } = string.Empty;

    /// <summary>
    /// Sender display name.
    /// </summary>
    public string SenderName { get; set; } = "Data Labeling System";

    /// <summary>
    /// SMTP username for authentication.
    /// </summary>
    public string SmtpUsername { get; set; } = string.Empty;

    /// <summary>
    /// SMTP password for authentication.
    /// </summary>
    public string SmtpPassword { get; set; } = string.Empty;

    /// <summary>
    /// Whether to use SSL/TLS.
    /// </summary>
    public bool UseSsl { get; set; } = true;

    /// <summary>
    /// Base URL for links in emails (e.g., "https://yourdomain.com").
    /// </summary>
    public string BaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// Email verification token expiry in hours.
    /// </summary>
    public int VerificationTokenExpiryHours { get; set; } = 24;

    /// <summary>
    /// Password reset token expiry in hours.
    /// </summary>
    public int PasswordResetTokenExpiryHours { get; set; } = 1;
}
