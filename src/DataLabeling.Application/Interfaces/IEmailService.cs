namespace DataLabeling.Application.Interfaces;

/// <summary>
/// Service interface for sending emails.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends an email verification email to a newly registered user.
    /// </summary>
    /// <param name="toEmail">Recipient email address.</param>
    /// <param name="userName">User's name for personalization.</param>
    /// <param name="verificationToken">The verification token.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task SendVerificationEmailAsync(
        string toEmail,
        string userName,
        string verificationToken,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a notification to admin/manager that a new user requires approval.
    /// </summary>
    /// <param name="toEmail">Admin/Manager email address.</param>
    /// <param name="adminName">Admin/Manager name.</param>
    /// <param name="newUserName">Name of user awaiting approval.</param>
    /// <param name="newUserEmail">Email of user awaiting approval.</param>
    /// <param name="newUserRole">Role requested by new user.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task SendApprovalNotificationAsync(
        string toEmail,
        string adminName,
        string newUserName,
        string newUserEmail,
        string newUserRole,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends approval confirmation email to user.
    /// </summary>
    /// <param name="toEmail">User email address.</param>
    /// <param name="userName">User's name.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task SendApprovalConfirmationAsync(
        string toEmail,
        string userName,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends rejection notification email to user.
    /// </summary>
    /// <param name="toEmail">User email address.</param>
    /// <param name="userName">User's name.</param>
    /// <param name="reason">Reason for rejection (optional).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task SendRejectionNotificationAsync(
        string toEmail,
        string userName,
        string? reason = null,
        CancellationToken cancellationToken = default);
}
