using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataLabeling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAnnotationTaskFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnnotatorDeadlineUtc",
                table: "TaskItem");

            migrationBuilder.DropColumn(
                name: "ReviewerDeadlineUtc",
                table: "DataItem");

            migrationBuilder.AddColumn<DateTime>(
                name: "Deadline",
                table: "AnnotationTask",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "AnnotationTask",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Priority",
                table: "AnnotationTask",
                type: "int",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<string>(
                name: "ReviewerNote",
                table: "AnnotationTask",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Comment_AuthorId",
                table: "Comment",
                column: "AuthorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Comment_AuthorId",
                table: "Comment");

            migrationBuilder.DropColumn(
                name: "Deadline",
                table: "AnnotationTask");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "AnnotationTask");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "AnnotationTask");

            migrationBuilder.DropColumn(
                name: "ReviewerNote",
                table: "AnnotationTask");

            migrationBuilder.AddColumn<DateTime>(
                name: "AnnotatorDeadlineUtc",
                table: "TaskItem",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewerDeadlineUtc",
                table: "DataItem",
                type: "datetime2",
                nullable: true);
        }
    }
}
