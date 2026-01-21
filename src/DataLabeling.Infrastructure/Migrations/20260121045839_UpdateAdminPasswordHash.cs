using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataLabeling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAdminPasswordHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$wXMuTHOs1CCEXDoLObDZGeJVtUcAKJVVkpFpEf9yXBgLIJRUEvuD.");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$8BsJX8VK9LZPXR.aqx7Fk.M3sHDj2KLaH8YIoZBvE7xF5PqQ0VnGS");
        }
    }
}
