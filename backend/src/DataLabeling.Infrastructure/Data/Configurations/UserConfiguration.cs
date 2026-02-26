using DataLabeling.Core.Entities;
using DataLabeling.Core.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

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

        // Seed Admin user
        // Password: Admin@123 (hashed with BCrypt, cost factor 11)
        // To regenerate hash: Console.WriteLine(BCrypt.Net.BCrypt.HashPassword("Admin@123", 11));
        builder.HasData(new User
        {
            Id = 1,
            Email = "admin@datalabeling.com",
            Name = "System Administrator",
            PasswordHash = "$2a$11$wXMuTHOs1CCEXDoLObDZGeJVtUcAKJVVkpFpEf9yXBgLIJRUEvuD.",
            Role = UserRole.Admin,
            Status = UserStatus.Active,
            CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
