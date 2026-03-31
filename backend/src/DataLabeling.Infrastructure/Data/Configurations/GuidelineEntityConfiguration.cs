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

        // Content stored as JSON array of strings
        builder.Property(g => g.Content)
            .IsRequired()
            .HasColumnType("nvarchar(max)")
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>()
            );

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
