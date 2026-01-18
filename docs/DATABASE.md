# DATABASE.md - Data Labeling System Database Schema

## Overview

| Property | Value |
|----------|-------|
| Database | SQL Server 2022 |
| ORM | Entity Framework Core 8 |
| Approach | Code-First |
| Naming Convention | PascalCase for tables and columns |
| Charset | UTF-8 (nvarchar) |
| DateTime | DATETIME2, stored in UTC |

## Important Notes

### 1. Task Entity Naming Conflict
C# có `System.Threading.Tasks.Task`. Để tránh conflict, trong code cần:
```csharp
using TaskEntity = DataLabeling.Core.Entities.Task;
// hoặc dùng full namespace
DataLabeling.Core.Entities.Task
```

### 2. Soft Delete Strategy
Project này **KHÔNG** sử dụng soft delete. Thay vào đó:
- User: Dùng `Status = Inactive` thay vì xóa
- Project: Dùng `Status = Archived` thay vì xóa
- Các entity khác: Hard delete với CASCADE

### 3. Audit Trail
- Mọi thay đổi quan trọng được ghi vào `ActivityLog`
- `CreatedAt` và `UpdatedAt` tự động cập nhật

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                        USER                                              │
│                         (Admin, Manager, Annotator, Reviewer)                            │
└───────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬───────────┘
        │             │             │             │             │             │
   creates(1:N)  assigns(1:N)  assigned(1:N) annotates(1:N) reviews(1:N) receives(1:N)
        │             │             │             │             │             │
        ▼             ▼             ▼             ▼             ▼             ▼
   ┌─────────┐   ┌─────────┐  ┌─────────┐  ┌────────────┐ ┌─────────┐ ┌──────────────┐
   │ PROJECT │   │  TASK   │  │  TASK   │  │ ANNOTATION │ │ REVIEW  │ │ NOTIFICATION │
   └────┬────┘   └────┬────┘  └─────────┘  └────────────┘ └────┬────┘ └──────────────┘
        │             │                                        │
   ┌────┴────┬────────┴────┐                                   │
   │         │             │                                   │
   ▼         ▼             ▼                                   ▼
┌───────┐ ┌───────┐ ┌──────────┐ ┌───────────┐         ┌────────────┐
│DATASET│ │ LABEL │ │GUIDELINE │ │ TASK_ITEM │         │ ERROR_TYPE │
└───┬───┘ └───┬───┘ └──────────┘ └─────┬─────┘         └──────┬─────┘
    │         │                        │                      │
    │ 1:N     │ 1:N                    │ M:N                  │ M:N
    ▼         │                        ▼                      ▼
┌───────────┐ │               ┌─────────────────────────────────────┐
│ DATA_ITEM │◄┘               │        REVIEW_ERROR_TYPE            │
└─────┬─────┘                 └─────────────────────────────────────┘
      │
      │ 1:N
      ▼
┌────────────┐   ┌─────────┐
│ ANNOTATION │   │ REVIEW  │
└────────────┘   └─────────┘
```

---

## Base Classes

### BaseEntity.cs
```csharp
namespace DataLabeling.Core.Entities;

public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
```

### IAuditableEntity.cs (Optional - for detailed audit)
```csharp
namespace DataLabeling.Core.Entities;

public interface IAuditableEntity
{
    int? CreatedById { get; set; }
    int? UpdatedById { get; set; }
}
```

---

## Entities Definition

### 1. USER

#### SQL Schema
```sql
CREATE TABLE [User] (
    Id                  INT IDENTITY(1,1) PRIMARY KEY,
    Name                NVARCHAR(100) NOT NULL,
    Email               NVARCHAR(255) NOT NULL,
    PasswordHash        NVARCHAR(255) NOT NULL,
    Role                NVARCHAR(20) NOT NULL,
    Status              NVARCHAR(20) NOT NULL DEFAULT 'Active',
    FailedLoginAttempts INT NOT NULL DEFAULT 0,
    LockoutEnd          DATETIME2 NULL,
    LastLoginAt         DATETIME2 NULL,
    CreatedAt           DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt           DATETIME2 NULL,
    
    CONSTRAINT UQ_User_Email UNIQUE (Email),
    CONSTRAINT CK_User_Role CHECK (Role IN ('Admin', 'Manager', 'Annotator', 'Reviewer')),
    CONSTRAINT CK_User_Status CHECK (Status IN ('Active', 'Inactive'))
);

CREATE INDEX IX_User_Email ON [User](Email);
CREATE INDEX IX_User_Role ON [User](Role);
CREATE INDEX IX_User_Status ON [User](Status);
```

#### Entity Class
```csharp
namespace DataLabeling.Core.Entities;

public class User : BaseEntity
{
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public UserRole Role { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public int FailedLoginAttempts { get; set; } = 0;
    public DateTime? LockoutEnd { get; set; }
    public DateTime? LastLoginAt { get; set; }

    // Navigation properties
    public virtual ICollection<Project> CreatedProjects { get; set; } = new List<Project>();
    public virtual ICollection<AnnotationTask> AssignedTasks { get; set; } = new List<AnnotationTask>();
    public virtual ICollection<AnnotationTask> TasksAssignedByMe { get; set; } = new List<AnnotationTask>();
    public virtual ICollection<Annotation> Annotations { get; set; } = new List<Annotation>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public virtual ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
}
```

#### Enum
```csharp
namespace DataLabeling.Core.Enums;

public enum UserRole
{
    Admin = 1,
    Manager = 2,
    Annotator = 3,
    Reviewer = 4
}

public enum UserStatus
{
    Active = 1,
    Inactive = 2
}
```

#### EF Configuration
```csharp
namespace DataLabeling.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("User");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(255);

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(u => u.Role)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(u => u.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(UserStatus.Active);

        builder.Property(u => u.FailedLoginAttempts)
            .HasDefaultValue(0);

        builder.Property(u => u.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        // Indexes
        builder.HasIndex(u => u.Role);
        builder.HasIndex(u => u.Status);
    }
}
```

#### Validation Rules
| Field | Rule |
|-------|------|
| Name | Required, 2-100 characters |
| Email | Required, valid email format, unique |
| Password | Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char |
| Role | Required, valid enum value |
| FailedLoginAttempts | Max 5 before lockout |
| LockoutEnd | Set to 15 minutes after 5 failed attempts |

---

### 2. PROJECT

#### SQL Schema
```sql
CREATE TABLE [Project] (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    Name            NVARCHAR(255) NOT NULL,
    Description     NVARCHAR(MAX) NULL,
    Type            NVARCHAR(30) NOT NULL,
    Status          NVARCHAR(20) NOT NULL DEFAULT 'Draft',
    Deadline        DATE NULL,
    CreatedById     INT NOT NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2 NULL,
    
    CONSTRAINT FK_Project_CreatedBy FOREIGN KEY (CreatedById) 
        REFERENCES [User](Id) ON DELETE NO ACTION,
    CONSTRAINT CK_Project_Type CHECK (Type IN ('Classification', 'ObjectDetection', 'Segmentation')),
    CONSTRAINT CK_Project_Status CHECK (Status IN ('Draft', 'Active', 'Completed', 'Archived'))
);

CREATE INDEX IX_Project_CreatedById ON [Project](CreatedById);
CREATE INDEX IX_Project_Status ON [Project](Status);
CREATE INDEX IX_Project_Deadline ON [Project](Deadline);
```

#### Entity Class
```csharp
namespace DataLabeling.Core.Entities;

public class Project : BaseEntity
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public ProjectType Type { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Draft;
    public DateOnly? Deadline { get; set; }
    public int CreatedById { get; set; }

    // Navigation properties
    public virtual User CreatedBy { get; set; } = null!;
    public virtual Dataset? Dataset { get; set; }
    public virtual Guideline? Guideline { get; set; }
    public virtual ICollection<Label> Labels { get; set; } = new List<Label>();
    public virtual ICollection<AnnotationTask> Tasks { get; set; } = new List<AnnotationTask>();
}
```

#### Enum
```csharp
namespace DataLabeling.Core.Enums;

public enum ProjectType
{
    Classification = 1,
    ObjectDetection = 2,
    Segmentation = 3
}

public enum ProjectStatus
{
    Draft = 1,
    Active = 2,
    Completed = 3,
    Archived = 4
}
```

#### EF Configuration
```csharp
namespace DataLabeling.Infrastructure.Data.Configurations;

public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("Project");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(p => p.Description)
            .HasColumnType("nvarchar(max)");

        builder.Property(p => p.Type)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(p => p.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(ProjectStatus.Draft);

        builder.Property(p => p.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        // Relationships
        builder.HasOne(p => p.CreatedBy)
            .WithMany(u => u.CreatedProjects)
            .HasForeignKey(p => p.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Dataset)
            .WithOne(d => d.Project)
            .HasForeignKey<Dataset>(d => d.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Guideline)
            .WithOne(g => g.Project)
            .HasForeignKey<Guideline>(g => g.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(p => p.CreatedById);
        builder.HasIndex(p => p.Status);
    }
}
```

#### Validation Rules
| Field | Rule |
|-------|------|
| Name | Required, 3-255 characters |
| Description | Optional, max 5000 characters |
| Type | Required, valid enum value |
| Deadline | Optional, must be future date when creating |
| CreatedById | Required, must exist in User table, must have Manager/Admin role |

#### Business Rules
1. Only Manager/Admin can create projects
2. Project must have at least 1 Label before changing status to Active
3. Project cannot be deleted if it has Tasks with status != Completed
4. When Project is Archived, all related Tasks are also marked Completed

---

### 3. DATASET

#### SQL Schema
```sql
CREATE TABLE [Dataset] (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId       INT NOT NULL,
    TotalItems      INT NOT NULL DEFAULT 0,
    TotalSizeMB     DECIMAL(10,2) NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2 NULL,
    
    CONSTRAINT FK_Dataset_Project FOREIGN KEY (ProjectId) 
        REFERENCES [Project](Id) ON DELETE CASCADE,
    CONSTRAINT UQ_Dataset_ProjectId UNIQUE (ProjectId)
);

CREATE UNIQUE INDEX IX_Dataset_ProjectId ON [Dataset](ProjectId);
```

#### Entity Class
```csharp
namespace DataLabeling.Core.Entities;

public class Dataset : BaseEntity
{
    public int ProjectId { get; set; }
    public int TotalItems { get; set; } = 0;
    public decimal TotalSizeMB { get; set; } = 0;

    // Navigation properties
    public virtual Project Project { get; set; } = null!;
    public virtual ICollection<DataItem> DataItems { get; set; } = new List<DataItem>();
}
```

#### EF Configuration
```csharp
namespace DataLabeling.Infrastructure.Data.Configurations;

public class DatasetConfiguration : IEntityTypeConfiguration<Dataset>
{
    public void Configure(EntityTypeBuilder<Dataset> builder)
    {
        builder.ToTable("Dataset");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.TotalItems)
            .HasDefaultValue(0);

        builder.Property(d => d.TotalSizeMB)
            .HasPrecision(10, 2)
            .HasDefaultValue(0);

        builder.Property(d => d.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        // Relationships - configured in ProjectConfiguration

        // Indexes
        builder.HasIndex(d => d.ProjectId)
            .IsUnique();
    }
}
```

#### Business Rules
1. Each Project has exactly ONE Dataset (1:1 relationship)
2. TotalItems and TotalSizeMB are updated automatically when DataItems are added/removed
3. Dataset is created automatically when Project is created

---

### 4. DATA_ITEM

#### SQL Schema
```sql
CREATE TABLE [DataItem] (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    DatasetId       INT NOT NULL,
    FileName        NVARCHAR(255) NOT NULL,
    FilePath        NVARCHAR(500) NOT NULL,
    FileSizeKB      INT NULL,
    ThumbnailPath   NVARCHAR(500) NULL,
    Status          NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2 NULL,
    
    CONSTRAINT FK_DataItem_Dataset FOREIGN KEY (DatasetId) 
        REFERENCES [Dataset](Id) ON DELETE CASCADE,
    CONSTRAINT CK_DataItem_Status CHECK (Status IN ('Pending', 'Assigned', 'InProgress', 'Submitted', 'Approved', 'Rejected'))
);

CREATE INDEX IX_DataItem_DatasetId ON [DataItem](DatasetId);
CREATE INDEX IX_DataItem_Status ON [DataItem](Status);
```

#### Entity Class
```csharp
namespace DataLabeling.Core.Entities;

public class DataItem : BaseEntity
{
    public int DatasetId { get; set; }
    public required string FileName { get; set; }
    public required string FilePath { get; set; }
    public int? FileSizeKB { get; set; }
    public string? ThumbnailPath { get; set; }
    public DataItemStatus Status { get; set; } = DataItemStatus.Pending;

    // Navigation properties
    public virtual Dataset Dataset { get; set; } = null!;
    public virtual ICollection<TaskItem> TaskItems { get; set; } = new List<TaskItem>();
    public virtual ICollection<Annotation> Annotations { get; set; } = new List<Annotation>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
}
```

#### Enum
```csharp
namespace DataLabeling.Core.Enums;

public enum DataItemStatus
{
    Pending = 1,      // Chưa được giao
    Assigned = 2,     // Đã giao cho Annotator
    InProgress = 3,   // Đang được gán nhãn
    Submitted = 4,    // Đã submit, chờ review
    Approved = 5,     // Đã được duyệt
    Rejected = 6      // Bị từ chối, cần sửa
}
```

#### EF Configuration
```csharp
namespace DataLabeling.Infrastructure.Data.Configurations;

public class DataItemConfiguration : IEntityTypeConfiguration<DataItem>
{
    public void Configure(EntityTypeBuilder<DataItem> builder)
    {
        builder.ToTable("DataItem");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.FileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(d => d.FilePath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(d => d.ThumbnailPath)
            .HasMaxLength(500);

        builder.Property(d => d.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(DataItemStatus.Pending);

        builder.Property(d => d.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        // Relationships
        builder.HasOne(d => d.Dataset)
            .WithMany(ds => ds.DataItems)
            .HasForeignKey(d => d.DatasetId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(d => d.DatasetId);
        builder.HasIndex(d => d.Status);
    }
}
```

#### Status Flow
```
┌─────────┐     ┌──────────┐     ┌────────────┐     ┌───────────┐
│ Pending │────▶│ Assigned │────▶│ InProgress │────▶│ Submitted │
└─────────┘     └──────────┘     └────────────┘     └─────┬─────┘
                                                         │
                      ┌──────────────────────────────────┼──────────────────┐
                      ▼                                  ▼                  │
                 ┌──────────┐                      ┌──────────┐             │
                 │ Rejected │─────────────────────▶│ Approved │             │
                 └────┬─────┘   (after re-submit)  └──────────┘             │
                      │                                                     │
                      └────────────────────────────────────────────────────┘
                                    (re-annotate)
```

---

### 5. LABEL

#### SQL Schema
```sql
CREATE TABLE [Label] (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId       INT NOT NULL,
    Name            NVARCHAR(100) NOT NULL,
    Color           CHAR(7) NOT NULL,
    Shortcut        CHAR(1) NULL,
    Description     NVARCHAR(500) NULL,
    DisplayOrder    INT NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2 NULL,
    
    CONSTRAINT FK_Label_Project FOREIGN KEY (ProjectId) 
        REFERENCES [Project](Id) ON DELETE CASCADE,
    CONSTRAINT UQ_Label_ProjectId_Name UNIQUE (ProjectId, Name),
    CONSTRAINT UQ_Label_ProjectId_Shortcut UNIQUE (ProjectId, Shortcut),
    CONSTRAINT CK_Label_Color CHECK (Color LIKE '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]')
);

CREATE INDEX IX_Label_ProjectId ON [Label](ProjectId);
```

#### Entity Class
```csharp
namespace DataLabeling.Core.Entities;

public class Label : BaseEntity
{
    public int ProjectId { get; set; }
    public required string Name { get; set; }
    public required string Color { get; set; }  // Hex: #FF5733
    public char? Shortcut { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; } = 0;

    // Navigation properties
    public virtual Project Project { get; set; } = null!;
    public virtual ICollection<Annotation> Annotations { get; set; } = new List<Annotation>();
}
```

#### EF Configuration
```csharp
namespace DataLabeling.Infrastructure.Data.Configurations;

public class LabelConfiguration : IEntityTypeConfiguration<Label>
{
    public void Configure(EntityTypeBuilder<Label> builder)
    {
        builder.ToTable("Label");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(l => l.Color)
            .IsRequired()
            .HasMaxLength(7)
            .IsFixedLength();

        builder.Property(l => l.Shortcut)
            .HasMaxLength(1)
            .IsFixedLength();

        builder.Property(l => l.Description)
            .HasMaxLength(500);

        builder.Property(l => l.DisplayOrder)
            .HasDefaultValue(0);

        builder.Property(l => l.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        // Relationships
        builder.HasOne(l => l.Project)
            .WithMany(p => p.Labels)
            .HasForeignKey(l => l.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique constraints
        builder.HasIndex(l => new { l.ProjectId, l.Name })
            .IsUnique();

        builder.HasIndex(l => new { l.ProjectId, l.Shortcut })
            .IsUnique()
            .HasFilter("[Shortcut] IS NOT NULL");

        // Indexes
        builder.HasIndex(l => l.ProjectId);
    }
}
```

#### Validation Rules
| Field | Rule |
|-------|------|
| Name | Required, 1-100 characters, unique per project |
| Color | Required, valid hex color (#RRGGBB format) |
| Shortcut | Optional, single character (A-Z, 0-9), unique per project |
| Description | Optional, max 500 characters |
| DisplayOrder | Auto-increment, used for ordering in UI |

#### Business Rules
1. Label cannot be deleted if it has Annotations
2. Label name must be unique within the same Project
3. Shortcut must be unique within the same Project

---

### 6. GUIDELINE

#### SQL Schema
```sql
CREATE TABLE [Guideline] (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId       INT NOT NULL,
    Content         NVARCHAR(MAX) NOT NULL,
    Version         INT NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2 NULL,
    
    CONSTRAINT FK_Guideline_Project FOREIGN KEY (ProjectId) 
        REFERENCES [Project](Id) ON DELETE CASCADE,
    CONSTRAINT UQ_Guideline_ProjectId UNIQUE (ProjectId)
);

CREATE UNIQUE INDEX IX_Guideline_ProjectId ON [Guideline](ProjectId);
```

#### Entity Class
```csharp
namespace DataLabeling.Core.Entities;

public class Guideline : BaseEntity
{
    public int ProjectId { get; set; }
    public string Content { get; set; } = string.Empty;  // HTML or Markdown
    public int Version { get; set; } = 1;

    // Navigation properties
    public virtual Project Project { get; set; } = null!;
}
```

#### EF Configuration
```csharp
namespace DataLabeling.Infrastructure.Data.Configurations;

public class GuidelineConfiguration : IEntityTypeConfiguration<Guideline>
{
    public void Configure(EntityTypeBuilder<Guideline> builder)
    {
        builder.ToTable("Guideline");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Content)
            .IsRequired()
            .HasColumnType("nvarchar(max)");

        builder.Property(g => g.Version)
            .HasDefaultValue(1);

        builder.Property(g => g.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        // Relationships - configured in ProjectConfiguration

        // Indexes
        builder.HasIndex(g => g.ProjectId)
            .IsUnique();
    }
}
```

#### Business Rules
1. Each Project has exactly ONE Guideline (1:1 relationship)
2. Version increments automatically when Content is updated
3. Guideline is created automatically when Project is created (with empty content)

---

### 7. ANNOTATION_TASK (renamed from Task to avoid conflict)

#### SQL Schema
```sql
CREATE TABLE [AnnotationTask] (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId       INT NOT NULL,
    AnnotatorId     INT NOT NULL,
    AssignedById    INT NOT NULL,
    Status          NVARCHAR(20) NOT NULL DEFAULT 'Assigned',
    TotalItems      INT NOT NULL DEFAULT 0,
    CompletedItems  INT NOT NULL DEFAULT 0,
    AssignedAt      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    SubmittedAt     DATETIME2 NULL,
    CompletedAt     DATETIME2 NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2 NULL,
    
    CONSTRAINT FK_AnnotationTask_Project FOREIGN KEY (ProjectId) 
        REFERENCES [Project](Id) ON DELETE NO ACTION,
    CONSTRAINT FK_AnnotationTask_Annotator FOREIGN KEY (AnnotatorId) 
        REFERENCES [User](Id) ON DELETE NO ACTION,
    CONSTRAINT FK_AnnotationTask_AssignedBy FOREIGN KEY (AssignedById) 
        REFERENCES [User](Id) ON DELETE NO ACTION,
    CONSTRAINT CK_AnnotationTask_Status CHECK (Status IN ('Assigned', 'InProgress', 'Submitted', 'Completed'))
);

CREATE INDEX IX_AnnotationTask_ProjectId ON [AnnotationTask](ProjectId);
CREATE INDEX IX_AnnotationTask_AnnotatorId ON [AnnotationTask](AnnotatorId);
CREATE INDEX IX_AnnotationTask_Status ON [AnnotationTask](Status);
```

#### Entity Class
```csharp
namespace DataLabeling.Core.Entities;

// Named AnnotationTask to avoid conflict with System.Threading.Tasks.Task
public class AnnotationTask : BaseEntity
{
    public int ProjectId { get; set; }
    public int AnnotatorId { get; set; }
    public int AssignedById { get; set; }
    public AnnotationTaskStatus Status { get; set; } = AnnotationTaskStatus.Assigned;
    public int TotalItems { get; set; } = 0;
    public int CompletedItems { get; set; } = 0;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation properties
    public virtual Project Project { get; set; } = null!;
    public virtual User Annotator { get; set; } = null!;
    public virtual User AssignedBy { get; set; } = null!;
    public virtual ICollection<TaskItem> TaskItems { get; set; } = new List<TaskItem>();
    
    // Computed property
    public double ProgressPercent => TotalItems > 0 ? (double)CompletedItems / TotalItems * 100 : 0;
}
```

#### Enum
```csharp
namespace DataLabeling.Core.Enums;

public enum AnnotationTaskStatus
{
    Assigned = 1,     // Đã giao, chưa bắt đầu
    InProgress = 2,   // Đang thực hiện
    Submitted = 3,    // Đã submit, chờ review tất cả items
    Completed = 4     // Hoàn thành (tất cả items đã Approved)
}
```

#### EF Configuration
```csharp
namespace DataLabeling.Infrastructure.Data.Configurations;

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

        builder.Property(t => t.TotalItems)
            .HasDefaultValue(0);

        builder.Property(t => t.CompletedItems)
            .HasDefaultValue(0);

        builder.Property(t => t.AssignedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(t => t.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        // Ignore computed property
        builder.Ignore(t => t.ProgressPercent);

        // Relationships
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

        // Indexes
        builder.HasIndex(t => t.ProjectId);
        builder.HasIndex(t => t.AnnotatorId);
        builder.HasIndex(t => t.Status);
    }
}
```

#### Status Flow
```
┌──────────┐     ┌────────────┐     ┌───────────┐     ┌───────────┐
│ Assigned │────▶│ InProgress │────▶│ Submitted │────▶│ Completed │
└──────────┘     └────────────┘     └───────────┘     └───────────┘
     │                                    │
     │                                    │ (if any item Rejected)
     │                                    ▼
     │                              ┌────────────┐
     └─────────────────────────────▶│ InProgress │
                                    └────────────┘
```

#### Business Rules
1. AnnotatorId must have Role = Annotator
2. AssignedById must have Role = Manager or Admin
3. TotalItems is set when TaskItems are added
4. CompletedItems is updated when TaskItem.Status changes to Completed
5. Task.Status changes to InProgress when first TaskItem is started
6. Task.Status changes to Submitted when all TaskItems are Completed
7. Task.Status changes to Completed when all DataItems are Approved

---

### 8. TASK_ITEM (Junction Table)

#### SQL Schema
```sql
CREATE TABLE [TaskItem] (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    TaskId          INT NOT NULL,
    DataItemId      INT NOT NULL,
    Status          NVARCHAR(20) NOT NULL DEFAULT 'Assigned',
    AssignedAt      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    StartedAt       DATETIME2 NULL,
    CompletedAt     DATETIME2 NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2 NULL,
    
    CONSTRAINT FK_TaskItem_Task FOREIGN KEY (TaskId) 
        REFERENCES [AnnotationTask](Id) ON DELETE CASCADE,
    CONSTRAINT FK_TaskItem_DataItem FOREIGN KEY (DataItemId) 
        REFERENCES [DataItem](Id) ON DELETE NO ACTION,
    CONSTRAINT UQ_TaskItem_TaskId_DataItemId UNIQUE (TaskId, DataItemId),
    CONSTRAINT CK_TaskItem_Status CHECK (Status IN ('Assigned', 'InProgress', 'Completed'))
);

CREATE INDEX IX_TaskItem_TaskId ON [TaskItem](TaskId);
CREATE INDEX IX_TaskItem_DataItemId ON [TaskItem](DataItemId);
CREATE INDEX IX_TaskItem_Status ON [TaskItem](Status);
```

#### Entity Class
```csharp
namespace DataLabeling.Core.Entities;

public class TaskItem : BaseEntity
{
    public int TaskId { get; set; }
    public int DataItemId { get; set; }
    public TaskItemStatus Status { get; set; } = TaskItemStatus.Assigned;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation properties
    public virtual AnnotationTask Task { get; set; } = null!;
    public virtual DataItem DataItem { get; set; } = null!;
}
```

#### Enum
```csharp
namespace DataLabeling.Core.Enums;

public enum TaskItemStatus
{
    Assigned = 1,
    InProgress = 2,
    Completed = 3
}
```

#### Business Rules
1. Each DataItem can only appear once in a Task (unique constraint)
2. DataItem can appear in multiple Tasks (re-assignment after rejection)
3. When TaskItem.Status = InProgress → DataItem.Status = InProgress
4. When TaskItem.Status = Completed → DataItem.Status = Submitted

---

### 9. ANNOTATION

#### SQL Schema
```sql
CREATE TABLE [Annotation] (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    DataItemId      INT NOT NULL,
    LabelId         INT NOT NULL,
    CreatedById     INT NOT NULL,
    Coordinates     NVARCHAR(MAX) NOT NULL,
    Attributes      NVARCHAR(MAX) NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2 NULL,
    
    CONSTRAINT FK_Annotation_DataItem FOREIGN KEY (DataItemId) 
        REFERENCES [DataItem](Id) ON DELETE CASCADE,
    CONSTRAINT FK_Annotation_Label FOREIGN KEY (LabelId) 
        REFERENCES [Label](Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Annotation_CreatedBy FOREIGN KEY (CreatedById) 
        REFERENCES [User](Id) ON DELETE NO ACTION
);

CREATE INDEX IX_Annotation_DataItemId ON [Annotation](DataItemId);
CREATE INDEX IX_Annotation_LabelId ON [Annotation](LabelId);
CREATE INDEX IX_Annotation_CreatedById ON [Annotation](CreatedById);
```

#### Entity Class
```csharp
namespace DataLabeling.Core.Entities;

public class Annotation : BaseEntity
{
    public int DataItemId { get; set; }
    public int LabelId { get; set; }
    public int CreatedById { get; set; }
    public required string Coordinates { get; set; }  // JSON
    public string? Attributes { get; set; }  // JSON

    // Navigation properties
    public virtual DataItem DataItem { get; set; } = null!;
    public virtual Label Label { get; set; } = null!;
    public virtual User CreatedBy { get; set; } = null!;
}
```

#### Coordinates JSON Schema
```json
// For Bounding Box (ObjectDetection)
{
    "type": "bbox",
    "x": 100,        // Top-left X coordinate
    "y": 200,        // Top-left Y coordinate
    "width": 150,    // Width in pixels
    "height": 100    // Height in pixels
}

// For Polygon (Segmentation)
{
    "type": "polygon",
    "points": [
        {"x": 100, "y": 100},
        {"x": 200, "y": 100},
        {"x": 200, "y": 200},
        {"x": 100, "y": 200}
    ]
}

// For Classification (entire image)
{
    "type": "classification"
}
```

#### Attributes JSON Schema (Optional)
```json
{
    "occluded": false,      // Bị che khuất
    "truncated": false,     // Bị cắt bởi edge
    "difficult": false,     // Khó nhận biết
    "confidence": 0.95,     // Độ tin cậy
    "notes": "Some notes"   // Ghi chú
}
```

---

### 10. REVIEW

#### SQL Schema
```sql
CREATE TABLE [Review] (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    DataItemId      INT NOT NULL,
    ReviewerId      INT NOT NULL,
    Decision        NVARCHAR(20) NOT NULL,
    Feedback        NVARCHAR(MAX) NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_Review_DataItem FOREIGN KEY (DataItemId) 
        REFERENCES [DataItem](Id) ON DELETE CASCADE,
    CONSTRAINT FK_Review_Reviewer FOREIGN KEY (ReviewerId) 
        REFERENCES [User](Id) ON DELETE NO ACTION,
    CONSTRAINT CK_Review_Decision CHECK (Decision IN ('Approved', 'Rejected'))
);

CREATE INDEX IX_Review_DataItemId ON [Review](DataItemId);
CREATE INDEX IX_Review_ReviewerId ON [Review](ReviewerId);
CREATE INDEX IX_Review_Decision ON [Review](Decision);
CREATE INDEX IX_Review_CreatedAt ON [Review](CreatedAt DESC);
```

#### Entity Class
```csharp
namespace DataLabeling.Core.Entities;

public class Review : BaseEntity
{
    public int DataItemId { get; set; }
    public int ReviewerId { get; set; }
    public ReviewDecision Decision { get; set; }
    public string? Feedback { get; set; }

    // Navigation properties
    public virtual DataItem DataItem { get; set; } = null!;
    public virtual User Reviewer { get; set; } = null!;
    public virtual ICollection<ReviewErrorType> ReviewErrorTypes { get; set; } = new List<ReviewErrorType>();
}
```

#### Enum
```csharp
namespace DataLabeling.Core.Enums;

public enum ReviewDecision
{
    Approved = 1,
    Rejected = 2
}
```

#### Validation Rules
| Field | Rule |
|-------|------|
| ReviewerId | Required, must have Role = Reviewer |
| Decision | Required |
| Feedback | **Required if Decision = Rejected**, optional otherwise |
| ReviewErrorTypes | **Required if Decision = Rejected** (at least 1) |

#### Business Rules
1. When Decision = Approved → DataItem.Status = Approved
2. When Decision = Rejected → DataItem.Status = Rejected
3. Feedback is mandatory when rejecting
4. At least one ErrorType must be selected when rejecting
5. A DataItem can have multiple Reviews (history)

---

### 11. ERROR_TYPE (Lookup Table)

#### SQL Schema
```sql
CREATE TABLE [ErrorType] (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    Code            NVARCHAR(10) NOT NULL,
    Name            NVARCHAR(100) NOT NULL,
    Description     NVARCHAR(500) NULL,
    
    CONSTRAINT UQ_ErrorType_Code UNIQUE (Code)
);

-- Seed Data
INSERT INTO [ErrorType] (Code, Name, Description) VALUES
('E01', 'Missing Object', 'An object that should be labeled is missing'),
('E02', 'Wrong Label', 'Object is labeled with incorrect label type'),
('E03', 'Inaccurate Boundary', 'Bounding box or polygon does not accurately cover the object'),
('E04', 'Guideline Violation', 'Annotation does not follow the project guidelines'),
('E05', 'Other', 'Other errors not covered above');
```

#### Entity Class
```csharp
namespace DataLabeling.Core.Entities;

public class ErrorType
{
    public int Id { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }

    // Navigation properties
    public virtual ICollection<ReviewErrorType> ReviewErrorTypes { get; set; } = new List<ReviewErrorType>();
}
```

**Note:** ErrorType does NOT inherit from BaseEntity because it's a lookup table without CreatedAt/UpdatedAt.

---

### 12. REVIEW_ERROR_TYPE (Junction Table)

#### SQL Schema
```sql
CREATE TABLE [ReviewErrorType] (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    ReviewId        INT NOT NULL,
    ErrorTypeId     INT NOT NULL,
    
    CONSTRAINT FK_ReviewErrorType_Review FOREIGN KEY (ReviewId) 
        REFERENCES [Review](Id) ON DELETE CASCADE,
    CONSTRAINT FK_ReviewErrorType_ErrorType FOREIGN KEY (ErrorTypeId) 
        REFERENCES [ErrorType](Id) ON DELETE NO ACTION,
    CONSTRAINT UQ_ReviewErrorType UNIQUE (ReviewId, ErrorTypeId)
);

CREATE INDEX IX_ReviewErrorType_ReviewId ON [ReviewErrorType](ReviewId);
CREATE INDEX IX_ReviewErrorType_ErrorTypeId ON [ReviewErrorType](ErrorTypeId);
```

#### Entity Class
```csharp
namespace DataLabeling.Core.Entities;

public class ReviewErrorType
{
    public int Id { get; set; }
    public int ReviewId { get; set; }
    public int ErrorTypeId { get; set; }

    // Navigation properties
    public virtual Review Review { get; set; } = null!;
    public virtual ErrorType ErrorType { get; set; } = null!;
}
```

---

### 13. NOTIFICATION

#### SQL Schema
```sql
CREATE TABLE [Notification] (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    UserId          INT NOT NULL,
    Type            NVARCHAR(30) NOT NULL,
    Title           NVARCHAR(255) NOT NULL,
    Content         NVARCHAR(MAX) NULL,
    ReferenceType   NVARCHAR(50) NULL,
    ReferenceId     INT NULL,
    IsRead          BIT NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_Notification_User FOREIGN KEY (UserId) 
        REFERENCES [User](Id) ON DELETE CASCADE,
    CONSTRAINT CK_Notification_Type CHECK (Type IN ('TaskAssigned', 'ItemApproved', 'ItemRejected', 'ProjectPublished', 'DeadlineReminder'))
);

CREATE INDEX IX_Notification_UserId ON [Notification](UserId);
CREATE INDEX IX_Notification_UserId_IsRead ON [Notification](UserId, IsRead);
CREATE INDEX IX_Notification_CreatedAt ON [Notification](CreatedAt DESC);
```

#### Entity Class
```csharp
namespace DataLabeling.Core.Entities;

public class Notification : BaseEntity
{
    public int UserId { get; set; }
    public NotificationType Type { get; set; }
    public required string Title { get; set; }
    public string? Content { get; set; }
    public string? ReferenceType { get; set; }  // "Task", "Project", "DataItem"
    public int? ReferenceId { get; set; }
    public bool IsRead { get; set; } = false;

    // Navigation properties
    public virtual User User { get; set; } = null!;
}
```

#### Enum
```csharp
namespace DataLabeling.Core.Enums;

public enum NotificationType
{
    TaskAssigned = 1,
    ItemApproved = 2,
    ItemRejected = 3,
    ProjectPublished = 4,
    DeadlineReminder = 5
}
```

#### Notification Templates
| Type | Title Template | When Triggered |
|------|----------------|----------------|
| TaskAssigned | "New task assigned" | Manager assigns task to Annotator |
| ItemApproved | "Your annotation was approved" | Reviewer approves DataItem |
| ItemRejected | "Your annotation needs revision" | Reviewer rejects DataItem |
| ProjectPublished | "Project is now active" | Manager changes Project status to Active |
| DeadlineReminder | "Deadline approaching" | 3 days before Project deadline |

---

### 14. ACTIVITY_LOG

#### SQL Schema
```sql
CREATE TABLE [ActivityLog] (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    UserId          INT NOT NULL,
    Action          NVARCHAR(20) NOT NULL,
    TargetType      NVARCHAR(50) NOT NULL,
    TargetId        INT NULL,
    Details         NVARCHAR(MAX) NULL,
    IpAddress       NVARCHAR(45) NULL,
    UserAgent       NVARCHAR(500) NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_ActivityLog_User FOREIGN KEY (UserId) 
        REFERENCES [User](Id) ON DELETE NO ACTION,
    CONSTRAINT CK_ActivityLog_Action CHECK (Action IN ('Create', 'Update', 'Delete', 'Submit', 'Approve', 'Reject', 'Assign', 'Login', 'Logout'))
);

CREATE INDEX IX_ActivityLog_UserId ON [ActivityLog](UserId);
CREATE INDEX IX_ActivityLog_TargetType_TargetId ON [ActivityLog](TargetType, TargetId);
CREATE INDEX IX_ActivityLog_Action ON [ActivityLog](Action);
CREATE INDEX IX_ActivityLog_CreatedAt ON [ActivityLog](CreatedAt DESC);
```

#### Entity Class
```csharp
namespace DataLabeling.Core.Entities;

public class ActivityLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public ActivityAction Action { get; set; }
    public required string TargetType { get; set; }  // "Project", "Task", "User", etc.
    public int? TargetId { get; set; }
    public string? Details { get; set; }  // JSON
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
}
```

#### Enum
```csharp
namespace DataLabeling.Core.Enums;

public enum ActivityAction
{
    Create = 1,
    Update = 2,
    Delete = 3,
    Submit = 4,
    Approve = 5,
    Reject = 6,
    Assign = 7,
    Login = 8,
    Logout = 9
}
```

#### Details JSON Example
```json
// For Update action
{
    "changes": [
        {
            "field": "Status",
            "oldValue": "Draft",
            "newValue": "Active"
        },
        {
            "field": "Name",
            "oldValue": "Old Project Name",
            "newValue": "New Project Name"
        }
    ]
}

// For Login action
{
    "success": true,
    "method": "password"
}

// For Assign action
{
    "taskId": 1,
    "annotatorId": 5,
    "itemCount": 100
}
```

---

## Database Diagram Summary

### Tables Count: 14
- **Actor**: 1 (User)
- **Core Entities**: 8 (Project, Dataset, DataItem, Label, Guideline, AnnotationTask, Annotation, Review)
- **Junction Tables**: 2 (TaskItem, ReviewErrorType)
- **Lookup Tables**: 1 (ErrorType)
- **Support Tables**: 2 (Notification, ActivityLog)

### Relationships Summary
| From | To | Type | FK Column | On Delete |
|------|------|------|-----------|-----------|
| Project | User | N:1 | CreatedById | Restrict |
| Dataset | Project | 1:1 | ProjectId | Cascade |
| DataItem | Dataset | N:1 | DatasetId | Cascade |
| Label | Project | N:1 | ProjectId | Cascade |
| Guideline | Project | 1:1 | ProjectId | Cascade |
| AnnotationTask | Project | N:1 | ProjectId | Restrict |
| AnnotationTask | User (Annotator) | N:1 | AnnotatorId | Restrict |
| AnnotationTask | User (Assigner) | N:1 | AssignedById | Restrict |
| TaskItem | AnnotationTask | N:1 | TaskId | Cascade |
| TaskItem | DataItem | N:1 | DataItemId | Restrict |
| Annotation | DataItem | N:1 | DataItemId | Cascade |
| Annotation | Label | N:1 | LabelId | Restrict |
| Annotation | User | N:1 | CreatedById | Restrict |
| Review | DataItem | N:1 | DataItemId | Cascade |
| Review | User | N:1 | ReviewerId | Restrict |
| ReviewErrorType | Review | N:1 | ReviewId | Cascade |
| ReviewErrorType | ErrorType | N:1 | ErrorTypeId | Restrict |
| Notification | User | N:1 | UserId | Cascade |
| ActivityLog | User | N:1 | UserId | Restrict |

---

## Seed Data

### ErrorTypes (Required)
```csharp
public static class DbSeeder
{
    public static async System.Threading.Tasks.Task SeedAsync(ApplicationDbContext context)
    {
        // Seed ErrorTypes
        if (!await context.ErrorTypes.AnyAsync())
        {
            context.ErrorTypes.AddRange(
                new ErrorType { Code = "E01", Name = "Missing Object", Description = "An object that should be labeled is missing" },
                new ErrorType { Code = "E02", Name = "Wrong Label", Description = "Object is labeled with incorrect label type" },
                new ErrorType { Code = "E03", Name = "Inaccurate Boundary", Description = "Bounding box or polygon does not accurately cover the object" },
                new ErrorType { Code = "E04", Name = "Guideline Violation", Description = "Annotation does not follow the project guidelines" },
                new ErrorType { Code = "E05", Name = "Other", Description = "Other errors not covered above" }
            );
            await context.SaveChangesAsync();
        }

        // Seed Admin User
        if (!await context.Users.AnyAsync(u => u.Role == UserRole.Admin))
        {
            context.Users.Add(new User
            {
                Name = "System Admin",
                Email = "admin@datalabeling.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = UserRole.Admin,
                Status = UserStatus.Active
            });
            await context.SaveChangesAsync();
        }
    }
}
```

### Default Admin Credentials
| Field | Value |
|-------|-------|
| Email | admin@datalabeling.com |
| Password | Admin@123 |
| Role | Admin |

**⚠️ IMPORTANT:** Change this password immediately after first deployment!
