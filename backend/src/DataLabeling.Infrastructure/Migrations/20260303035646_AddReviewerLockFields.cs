using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataLabeling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewerLockFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AssignedReviewerId",
                table: "DataItem",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewAssignedAt",
                table: "DataItem",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewLockExpiry",
                table: "DataItem",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DataItem_AssignedReviewerId",
                table: "DataItem",
                column: "AssignedReviewerId");

            migrationBuilder.AddForeignKey(
                name: "FK_DataItem_User_AssignedReviewerId",
                table: "DataItem",
                column: "AssignedReviewerId",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DataItem_User_AssignedReviewerId",
                table: "DataItem");

            migrationBuilder.DropIndex(
                name: "IX_DataItem_AssignedReviewerId",
                table: "DataItem");

            migrationBuilder.DropColumn(
                name: "AssignedReviewerId",
                table: "DataItem");

            migrationBuilder.DropColumn(
                name: "ReviewAssignedAt",
                table: "DataItem");

            migrationBuilder.DropColumn(
                name: "ReviewLockExpiry",
                table: "DataItem");
        }
    }
}
