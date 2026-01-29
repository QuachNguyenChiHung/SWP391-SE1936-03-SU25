using DataLabeling.Application.Interfaces;
using DataLabeling.Application.Settings;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace DataLabeling.Infrastructure.Services;

/// <summary>
/// Email service implementation using MailKit.
/// </summary>
public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
    {
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    public async Task SendVerificationEmailAsync(
        string toEmail,
        string userName,
        string verificationToken,
        CancellationToken cancellationToken = default)
    {
        var verificationLink = $"{_emailSettings.BaseUrl}/verify-email?token={verificationToken}&email={Uri.EscapeDataString(toEmail)}";

        var subject = "Verify Your Email - Data Labeling System";
        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px;'>
                    <h2 style='color: #333;'>Welcome to Data Labeling System!</h2>
                    <p>Hi <strong>{userName}</strong>,</p>
                    <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
                    <p style='margin: 30px 0; text-align: center;'>
                        <a href='{verificationLink}'
                           style='background-color: #007bff; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 4px; display: inline-block;'>
                            Verify Email
                        </a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style='word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 4px; font-size: 12px;'>{verificationLink}</p>
                    <p><strong>This link will expire in {_emailSettings.VerificationTokenExpiryHours} hours.</strong></p>
                    <p style='color: #666;'>If you did not create an account, please ignore this email.</p>
                    <hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'/>
                    <p style='color: #999; font-size: 12px;'>Data Labeling System</p>
                </div>
            </body>
            </html>";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendApprovalNotificationAsync(
        string toEmail,
        string adminName,
        string newUserName,
        string newUserEmail,
        string newUserRole,
        CancellationToken cancellationToken = default)
    {
        var approvalLink = $"{_emailSettings.BaseUrl}/admin/pending-users";

        var subject = "New User Pending Approval - Data Labeling System";
        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px;'>
                    <h2 style='color: #333;'>New User Registration</h2>
                    <p>Hi <strong>{adminName}</strong>,</p>
                    <p>A new user has registered and requires your approval:</p>
                    <table style='border-collapse: collapse; margin: 20px 0; width: 100%;'>
                        <tr>
                            <td style='padding: 10px; border: 1px solid #ddd; background-color: #f1f1f1; width: 120px;'><strong>Name:</strong></td>
                            <td style='padding: 10px; border: 1px solid #ddd;'>{newUserName}</td>
                        </tr>
                        <tr>
                            <td style='padding: 10px; border: 1px solid #ddd; background-color: #f1f1f1;'><strong>Email:</strong></td>
                            <td style='padding: 10px; border: 1px solid #ddd;'>{newUserEmail}</td>
                        </tr>
                        <tr>
                            <td style='padding: 10px; border: 1px solid #ddd; background-color: #f1f1f1;'><strong>Requested Role:</strong></td>
                            <td style='padding: 10px; border: 1px solid #ddd;'>{newUserRole}</td>
                        </tr>
                    </table>
                    <p style='text-align: center;'>
                        <a href='{approvalLink}'
                           style='background-color: #28a745; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 4px; display: inline-block;'>
                            Review Pending Users
                        </a>
                    </p>
                    <hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'/>
                    <p style='color: #999; font-size: 12px;'>Data Labeling System</p>
                </div>
            </body>
            </html>";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendApprovalConfirmationAsync(
        string toEmail,
        string userName,
        CancellationToken cancellationToken = default)
    {
        var loginLink = $"{_emailSettings.BaseUrl}/login";

        var subject = "Your Account Has Been Approved - Data Labeling System";
        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px;'>
                    <h2 style='color: #28a745;'>Account Approved!</h2>
                    <p>Hi <strong>{userName}</strong>,</p>
                    <p>Great news! Your account has been approved. You can now log in to the Data Labeling System.</p>
                    <p style='margin: 30px 0; text-align: center;'>
                        <a href='{loginLink}'
                           style='background-color: #007bff; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 4px; display: inline-block;'>
                            Log In Now
                        </a>
                    </p>
                    <hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'/>
                    <p style='color: #999; font-size: 12px;'>Data Labeling System</p>
                </div>
            </body>
            </html>";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    public async Task SendRejectionNotificationAsync(
        string toEmail,
        string userName,
        string? reason = null,
        CancellationToken cancellationToken = default)
    {
        var subject = "Account Registration Update - Data Labeling System";
        var reasonText = string.IsNullOrEmpty(reason)
            ? "No specific reason was provided."
            : $"Reason: {reason}";

        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px;'>
                    <h2 style='color: #dc3545;'>Account Registration Update</h2>
                    <p>Hi <strong>{userName}</strong>,</p>
                    <p>We regret to inform you that your account registration has not been approved.</p>
                    <p style='background-color: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107;'>
                        {reasonText}
                    </p>
                    <p>If you believe this is an error, please contact the system administrator.</p>
                    <hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'/>
                    <p style='color: #999; font-size: 12px;'>Data Labeling System</p>
                </div>
            </body>
            </html>";

        await SendEmailAsync(toEmail, subject, body, cancellationToken);
    }

    private async Task SendEmailAsync(
        string toEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();

            var secureSocketOptions = _emailSettings.UseSsl
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.None;

            await client.ConnectAsync(
                _emailSettings.SmtpHost,
                _emailSettings.SmtpPort,
                secureSocketOptions,
                cancellationToken);

            await client.AuthenticateAsync(
                _emailSettings.SmtpUsername,
                _emailSettings.SmtpPassword,
                cancellationToken);

            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("Email sent successfully to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            throw;
        }
    }
}
