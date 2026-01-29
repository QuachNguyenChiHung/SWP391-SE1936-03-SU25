using DataLabeling.Core.Enums;

namespace DataLabeling.Core.Entities;

/// <summary>
/// User entity - represents system users (Admin, Manager, Annotator, Reviewer).
/// </summary>
public class User : BaseEntity
{
    /// <summary>
    /// User's full name.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// User's email address - must be unique.
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// Hashed password (BCrypt).
    /// </summary>
    public required string PasswordHash { get; set; }

    /// <summary>
    /// User's role in the system.
    /// </summary>
    public UserRole Role { get; set; }

    /// <summary>
    /// Account status (Active/Inactive).
    /// </summary>
    public UserStatus Status { get; set; } = UserStatus.Active;

    /// <summary>
    /// Number of consecutive failed login attempts.
    /// Reset to 0 on successful login.
    /// </summary>
    public int FailedLoginAttempts { get; set; } = 0;

    /// <summary>
    /// When the account lockout ends. Null if not locked.
    /// Account is locked after 5 failed attempts for 15 minutes.
    /// </summary>
    public DateTime? LockoutEnd { get; set; }

    /// <summary>
    /// Timestamp of last successful login.
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    // ==================== Email Verification Properties ====================

    /// <summary>
    /// Token for email verification (cryptographically secure random string).
    /// </summary>
    public string? EmailVerificationToken { get; set; }

    /// <summary>
    /// When the email verification token expires.
    /// </summary>
    public DateTime? EmailVerificationTokenExpiry { get; set; }

    /// <summary>
    /// Whether the user's email has been verified.
    /// </summary>
    public bool IsEmailVerified { get; set; } = false;

    // ==================== Approval Properties ====================

    /// <summary>
    /// Foreign key to the user who approved this account.
    /// </summary>
    public int? ApprovedById { get; set; }

    /// <summary>
    /// When the account was approved.
    /// </summary>
    public DateTime? ApprovedAt { get; set; }

    /// <summary>
    /// Reason for rejection (if rejected).
    /// </summary>
    public string? RejectionReason { get; set; }

    // ==================== Navigation Properties ====================

    /// <summary>
    /// User who approved this account (Admin or Manager).
    /// </summary>
    public virtual User? ApprovedBy { get; set; }

    /// <summary>
    /// Projects created by this user (as Manager).
    /// </summary>
    public virtual ICollection<Project> CreatedProjects { get; set; } = new List<Project>();

    /// <summary>
    /// Tasks assigned to this user (as Annotator).
    /// </summary>
    public virtual ICollection<AnnotationTask> AssignedTasks { get; set; } = new List<AnnotationTask>();

    /// <summary>
    /// Tasks assigned by this user (as Manager).
    /// </summary>
    public virtual ICollection<AnnotationTask> TasksAssignedByMe { get; set; } = new List<AnnotationTask>();

    /// <summary>
    /// Annotations created by this user.
    /// </summary>
    public virtual ICollection<Annotation> Annotations { get; set; } = new List<Annotation>();

    /// <summary>
    /// Reviews made by this user (as Reviewer).
    /// </summary>
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    /// <summary>
    /// Notifications for this user.
    /// </summary>
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    /// <summary>
    /// Activity logs for this user.
    /// </summary>
    public virtual ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
}
