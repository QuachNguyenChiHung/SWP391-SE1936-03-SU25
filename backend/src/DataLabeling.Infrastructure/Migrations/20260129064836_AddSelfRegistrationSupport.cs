using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataLabeling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSelfRegistrationSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "User",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ApprovedById",
                table: "User",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailVerificationToken",
                table: "User",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailVerificationTokenExpiry",
                table: "User",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsEmailVerified",
                table: "User",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "User",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "ApprovedAt", "ApprovedById", "EmailVerificationToken", "EmailVerificationTokenExpiry", "IsEmailVerified", "RejectionReason" },
                values: new object[] { null, null, null, null, false, null });

            migrationBuilder.CreateIndex(
                name: "IX_User_ApprovedById",
                table: "User",
                column: "ApprovedById");

            migrationBuilder.AddForeignKey(
                name: "FK_User_User_ApprovedById",
                table: "User",
                column: "ApprovedById",
                principalTable: "User",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_User_User_ApprovedById",
                table: "User");

            migrationBuilder.DropIndex(
                name: "IX_User_ApprovedById",
                table: "User");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "User");

            migrationBuilder.DropColumn(
                name: "ApprovedById",
                table: "User");

            migrationBuilder.DropColumn(
                name: "EmailVerificationToken",
                table: "User");

            migrationBuilder.DropColumn(
                name: "EmailVerificationTokenExpiry",
                table: "User");

            migrationBuilder.DropColumn(
                name: "IsEmailVerified",
                table: "User");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "User");
        }
    }
}
