using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DataLabeling.Infrastructure.Data.Configurations;

// ==================== Dataset Configuration ====================
public class DatasetConfiguration : IEntityTypeConfiguration<Dataset>
{
    public void Configure(EntityTypeBuilder<Dataset> builder)
    {
        builder.ToTable("Dataset");
        builder.HasKey(d => d.Id);

        builder.Property(d => d.TotalItems).HasDefaultValue(0);
        builder.Property(d => d.TotalSizeMB).HasPrecision(10, 2).HasDefaultValue(0);
        builder.Property(d => d.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(d => d.ProjectId).IsUnique();
    }
}

// ==================== DataItem Configuration ====================
public class DataItemConfiguration : IEntityTypeConfiguration<DataItem>
{
    public void Configure(EntityTypeBuilder<DataItem> builder)
    {
        builder.ToTable("DataItem");
        builder.HasKey(d => d.Id);

        builder.Property(d => d.FileName).IsRequired().HasMaxLength(255);
        builder.Property(d => d.FilePath).IsRequired().HasMaxLength(500);
        builder.Property(d => d.ThumbnailPath).HasMaxLength(500);

        builder.Property(d => d.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(DataItemStatus.Pending);

        builder.Property(d => d.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(d => d.Dataset)
            .WithMany(ds => ds.DataItems)
            .HasForeignKey(d => d.DatasetId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(d => d.DatasetId);
        builder.HasIndex(d => d.Status);
    }
}

// ==================== Label Configuration ====================
public class LabelConfiguration : IEntityTypeConfiguration<Label>
{
    public void Configure(EntityTypeBuilder<Label> builder)
    {
        builder.ToTable("Label");
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Name).IsRequired().HasMaxLength(100);
        builder.Property(l => l.Color).IsRequired().HasMaxLength(7).IsFixedLength();
        builder.Property(l => l.Shortcut).HasMaxLength(1).IsFixedLength();
        builder.Property(l => l.Description).HasMaxLength(500);
        builder.Property(l => l.DisplayOrder).HasDefaultValue(0);
        builder.Property(l => l.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(l => l.Project)
            .WithMany(p => p.Labels)
            .HasForeignKey(l => l.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(l => new { l.ProjectId, l.Name }).IsUnique();
        builder.HasIndex(l => new { l.ProjectId, l.Shortcut }).IsUnique().HasFilter("[Shortcut] IS NOT NULL");
        builder.HasIndex(l => l.ProjectId);
    }
}

// ==================== Guideline Configuration ====================
public class GuidelineConfiguration : IEntityTypeConfiguration<Guideline>
{
    public void Configure(EntityTypeBuilder<Guideline> builder)
    {
        builder.ToTable("Guideline");
        builder.HasKey(g => g.Id);

        builder.Property(g => g.Content).IsRequired().HasColumnType("nvarchar(max)");
        builder.Property(g => g.Version).HasDefaultValue(1);
        builder.Property(g => g.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(g => g.ProjectId).IsUnique();
    }
}

// ==================== AnnotationTask Configuration ====================
public class AnnotationTaskConfiguration : IEntityTypeConfiguration<AnnotationTask>
{
    public void Configure(EntityTypeBuilder<AnnotationTask> builder)
    {
        builder.ToTable("AnnotationTask");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(AnnotationTaskStatus.Assigned);

        builder.Property(t => t.TotalItems).HasDefaultValue(0);
        builder.Property(t => t.CompletedItems).HasDefaultValue(0);
        builder.Property(t => t.AssignedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(t => t.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.Ignore(t => t.ProgressPercent);

        builder.HasOne(t => t.Project)
            .WithMany(p => p.Tasks)
            .HasForeignKey(t => t.ProjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Annotator)
            .WithMany(u => u.AssignedTasks)
            .HasForeignKey(t => t.AnnotatorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.AssignedBy)
            .WithMany(u => u.TasksAssignedByMe)
            .HasForeignKey(t => t.AssignedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => t.ProjectId);
        builder.HasIndex(t => t.AnnotatorId);
        builder.HasIndex(t => t.Status);
    }
}

// ==================== TaskItem Configuration ====================
public class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.ToTable("TaskItem");
        builder.HasKey(ti => ti.Id);

        builder.Property(ti => ti.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(TaskItemStatus.Assigned);

        builder.Property(ti => ti.AssignedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(ti => ti.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(ti => ti.Task)
            .WithMany(t => t.TaskItems)
            .HasForeignKey(ti => ti.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ti => ti.DataItem)
            .WithMany(d => d.TaskItems)
            .HasForeignKey(ti => ti.DataItemId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(ti => new { ti.TaskId, ti.DataItemId }).IsUnique();
        builder.HasIndex(ti => ti.TaskId);
        builder.HasIndex(ti => ti.DataItemId);
        builder.HasIndex(ti => ti.Status);
    }
}

// ==================== Annotation Configuration ====================
public class AnnotationConfiguration : IEntityTypeConfiguration<Annotation>
{
    public void Configure(EntityTypeBuilder<Annotation> builder)
    {
        builder.ToTable("Annotation");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Coordinates).IsRequired().HasColumnType("nvarchar(max)");
        builder.Property(a => a.Attributes).HasColumnType("nvarchar(max)");
        builder.Property(a => a.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(a => a.DataItem)
            .WithMany(d => d.Annotations)
            .HasForeignKey(a => a.DataItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Label)
            .WithMany(l => l.Annotations)
            .HasForeignKey(a => a.LabelId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.CreatedBy)
            .WithMany(u => u.Annotations)
            .HasForeignKey(a => a.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => a.DataItemId);
        builder.HasIndex(a => a.LabelId);
        builder.HasIndex(a => a.CreatedById);
    }
}

// ==================== Review Configuration ====================
public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.ToTable("Review");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Decision)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(r => r.Feedback).HasColumnType("nvarchar(max)");
        builder.Property(r => r.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(r => r.DataItem)
            .WithMany(d => d.Reviews)
            .HasForeignKey(r => r.DataItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Reviewer)
            .WithMany(u => u.Reviews)
            .HasForeignKey(r => r.ReviewerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => r.DataItemId);
        builder.HasIndex(r => r.ReviewerId);
        builder.HasIndex(r => r.Decision);
        builder.HasIndex(r => r.CreatedAt).IsDescending();
    }
}

// ==================== ErrorType Configuration ====================
public class ErrorTypeConfiguration : IEntityTypeConfiguration<ErrorType>
{
    public void Configure(EntityTypeBuilder<ErrorType> builder)
    {
        builder.ToTable("ErrorType");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code).IsRequired().HasMaxLength(10);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(100);
        builder.Property(e => e.Description).HasMaxLength(500);

        builder.HasIndex(e => e.Code).IsUnique();

        // Seed data
        builder.HasData(
            new ErrorType { Id = 1, Code = "E01", Name = "Missing Object", Description = "An object that should be labeled is missing" },
            new ErrorType { Id = 2, Code = "E02", Name = "Wrong Label", Description = "Object is labeled with incorrect label type" },
            new ErrorType { Id = 3, Code = "E03", Name = "Inaccurate Boundary", Description = "Bounding box or polygon does not accurately cover the object" },
            new ErrorType { Id = 4, Code = "E04", Name = "Guideline Violation", Description = "Annotation does not follow the project guidelines" },
            new ErrorType { Id = 5, Code = "E05", Name = "Other", Description = "Other errors not covered above" }
        );
    }
}

// ==================== ReviewErrorType Configuration ====================
public class ReviewErrorTypeConfiguration : IEntityTypeConfiguration<ReviewErrorType>
{
    public void Configure(EntityTypeBuilder<ReviewErrorType> builder)
    {
        builder.ToTable("ReviewErrorType");
        builder.HasKey(re => re.Id);

        builder.HasOne(re => re.Review)
            .WithMany(r => r.ReviewErrorTypes)
            .HasForeignKey(re => re.ReviewId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(re => re.ErrorType)
            .WithMany(e => e.ReviewErrorTypes)
            .HasForeignKey(re => re.ErrorTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(re => new { re.ReviewId, re.ErrorTypeId }).IsUnique();
        builder.HasIndex(re => re.ReviewId);
        builder.HasIndex(re => re.ErrorTypeId);
    }
}

// ==================== Notification Configuration ====================
public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notification");
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Type)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(n => n.Title).IsRequired().HasMaxLength(255);
        builder.Property(n => n.Content).HasColumnType("nvarchar(max)");
        builder.Property(n => n.ReferenceType).HasMaxLength(50);
        builder.Property(n => n.IsRead).HasDefaultValue(false);
        builder.Property(n => n.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(n => n.UserId);
        builder.HasIndex(n => new { n.UserId, n.IsRead });
        builder.HasIndex(n => n.CreatedAt).IsDescending();
    }
}

// ==================== ActivityLog Configuration ====================
public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
{
    public void Configure(EntityTypeBuilder<ActivityLog> builder)
    {
        builder.ToTable("ActivityLog");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Action)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(a => a.TargetType).IsRequired().HasMaxLength(50);
        builder.Property(a => a.Details).HasColumnType("nvarchar(max)");
        builder.Property(a => a.IpAddress).HasMaxLength(45);
        builder.Property(a => a.UserAgent).HasMaxLength(500);
        builder.Property(a => a.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(a => a.User)
            .WithMany(u => u.ActivityLogs)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => a.UserId);
        builder.HasIndex(a => new { a.TargetType, a.TargetId });
        builder.HasIndex(a => a.Action);
        builder.HasIndex(a => a.CreatedAt).IsDescending();
    }
}
