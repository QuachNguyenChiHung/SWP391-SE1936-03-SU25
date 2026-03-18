using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DataLabeling.Infrastructure.Data.Configurations;

public class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.ToTable("Comment");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.TaskItemId)
            .IsRequired();

        builder.Property(c => c.AuthorId)
            .IsRequired();

        builder.Property(c => c.AuthorRole)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(c => c.Content)
            .IsRequired();

        builder.Property(c => c.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        // Foreign keys
        builder.HasOne(c => c.TaskItem)
            .WithMany(ti => ti.Comments)
            .HasForeignKey(c => c.TaskItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.Author)
            .WithMany()
            .HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(c => c.TaskItemId);
        builder.HasIndex(c => new { c.TaskItemId, c.AuthorRole });
    }
}
