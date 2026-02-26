using DataLabeling.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace DataLabeling.Infrastructure.Data;

/// <summary>
/// Application database context - main entry point for Entity Framework Core.
/// </summary>
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // ==================== DbSets ====================

    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Dataset> Datasets => Set<Dataset>();
    public DbSet<DataItem> DataItems => Set<DataItem>();
    public DbSet<Label> Labels => Set<Label>();
    public DbSet<Guideline> Guidelines => Set<Guideline>();
    public DbSet<AnnotationTask> AnnotationTasks => Set<AnnotationTask>();
    public DbSet<TaskItem> TaskItems => Set<TaskItem>();
    public DbSet<Annotation> Annotations => Set<Annotation>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ErrorType> ErrorTypes => Set<ErrorType>();
    public DbSet<ReviewErrorType> ReviewErrorTypes => Set<ReviewErrorType>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all configurations from assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Auto-update UpdatedAt timestamp for entities that inherit from BaseEntity
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
