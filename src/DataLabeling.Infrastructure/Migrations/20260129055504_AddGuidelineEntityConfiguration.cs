using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataLabeling.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGuidelineEntityConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Guideline_Project_ProjectId",
                table: "Guideline");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Guideline",
                table: "Guideline");

            migrationBuilder.RenameTable(
                name: "Guideline",
                newName: "Guidelines");

            migrationBuilder.RenameIndex(
                name: "IX_Guideline_ProjectId",
                table: "Guidelines",
                newName: "IX_Guidelines_ProjectId");

            migrationBuilder.AlterColumn<string>(
                name: "FilePath",
                table: "Guidelines",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "FileName",
                table: "Guidelines",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ContentType",
                table: "Guidelines",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Content",
                table: "Guidelines",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Guidelines",
                table: "Guidelines",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Guidelines_Project_ProjectId",
                table: "Guidelines",
                column: "ProjectId",
                principalTable: "Project",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Guidelines_Project_ProjectId",
                table: "Guidelines");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Guidelines",
                table: "Guidelines");

            migrationBuilder.RenameTable(
                name: "Guidelines",
                newName: "Guideline");

            migrationBuilder.RenameIndex(
                name: "IX_Guidelines_ProjectId",
                table: "Guideline",
                newName: "IX_Guideline_ProjectId");

            migrationBuilder.AlterColumn<string>(
                name: "FilePath",
                table: "Guideline",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "FileName",
                table: "Guideline",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ContentType",
                table: "Guideline",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Content",
                table: "Guideline",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Guideline",
                table: "Guideline",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Guideline_Project_ProjectId",
                table: "Guideline",
                column: "ProjectId",
                principalTable: "Project",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
