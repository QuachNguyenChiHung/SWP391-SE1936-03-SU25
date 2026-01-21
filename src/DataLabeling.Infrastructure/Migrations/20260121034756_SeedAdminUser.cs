using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataLabeling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedAdminUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "User",
                columns: new[] { "Id", "CreatedAt", "Email", "LastLoginAt", "LockoutEnd", "Name", "PasswordHash", "Role", "Status", "UpdatedAt" },
                values: new object[] { 1, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@datalabeling.com", null, null, "System Administrator", "$2a$11$8BsJX8VK9LZPXR.aqx7Fk.M3sHDj2KLaH8YIoZBvE7xF5PqQ0VnGS", "Admin", "Active", null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1);
        }
    }
}
