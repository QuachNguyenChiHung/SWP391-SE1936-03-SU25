using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataLabeling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGuidelineFileSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                table: "Guideline",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FileName",
                table: "Guideline",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FilePath",
                table: "Guideline",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "FileSize",
                table: "Guideline",
                type: "bigint",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContentType",
                table: "Guideline");

            migrationBuilder.DropColumn(
                name: "FileName",
                table: "Guideline");

            migrationBuilder.DropColumn(
                name: "FilePath",
                table: "Guideline");

            migrationBuilder.DropColumn(
                name: "FileSize",
                table: "Guideline");
        }
    }
}
