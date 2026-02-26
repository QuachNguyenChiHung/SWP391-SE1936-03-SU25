using DataLabeling.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DataLabeling.Infrastructure.Data.Configurations;

/// <summary>
/// Entity configuration for Guideline entity.
/// </summary>
public class GuidelineEntityConfiguration : IEntityTypeConfiguration<Guideline>
{
    public void Configure(EntityTypeBuilder<Guideline> builder)
    {
        builder.ToTable("Guidelines");

        builder.HasKey(g => g.Id);

        // ✅ Content - nullable (text guideline hoặc null nếu dùng file)
        builder.Property(g => g.Content)
            .IsRequired(false)
            .HasColumnType("nvarchar(max)");

        // ✅ File storage properties - all nullable
        builder.Property(g => g.FilePath)
            .IsRequired(false)
            .HasMaxLength(500);

        builder.Property(g => g.FileName)
            .IsRequired(false)
            .HasMaxLength(255);

        builder.Property(g => g.FileSize)
            .IsRequired(false);

        builder.Property(g => g.ContentType)
            .IsRequired(false)
            .HasMaxLength(100);

        // Version - required with default
        builder.Property(g => g.Version)
            .IsRequired()
            .HasDefaultValue(1);

        // Timestamps
        builder.Property(g => g.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(g => g.UpdatedAt)
            .IsRequired(false);

        // ✅ Relationship: One Project has One Guideline
        builder.HasOne(g => g.Project)
            .WithOne(p => p.Guideline)
            .HasForeignKey<Guideline>(g => g.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index on ProjectId for faster lookups
        builder.HasIndex(g => g.ProjectId)
            .IsUnique();
    }
}
