using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Portfolio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixAnalyticsCascadeDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LinkClickLogs_ResumeProfileLinks_LinkId",
                table: "LinkClickLogs");

            migrationBuilder.AlterColumn<Guid>(
                name: "LinkId",
                table: "LinkClickLogs",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "LinkTypeName",
                table: "LinkClickLogs",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetUrl",
                table: "LinkClickLogs",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_LinkClickLogs_ResumeProfileLinks_LinkId",
                table: "LinkClickLogs",
                column: "LinkId",
                principalTable: "ResumeProfileLinks",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LinkClickLogs_ResumeProfileLinks_LinkId",
                table: "LinkClickLogs");

            migrationBuilder.DropColumn(
                name: "LinkTypeName",
                table: "LinkClickLogs");

            migrationBuilder.DropColumn(
                name: "TargetUrl",
                table: "LinkClickLogs");

            migrationBuilder.AlterColumn<Guid>(
                name: "LinkId",
                table: "LinkClickLogs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_LinkClickLogs_ResumeProfileLinks_LinkId",
                table: "LinkClickLogs",
                column: "LinkId",
                principalTable: "ResumeProfileLinks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
