using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Portfolio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAiChatAnalytics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VisitorSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrackingId = table.Column<string>(type: "text", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Country = table.Column<string>(type: "text", nullable: true),
                    City = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisitorSessions", x => x.Id);
                });

            migrationBuilder.AddColumn<Guid>(
                name: "VisitorSessionId",
                table: "PageViewLogs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VisitorSessionId",
                table: "LinkClickLogs",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AiQueryLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VisitorSessionId = table.Column<Guid>(type: "uuid", nullable: true),
                    QueryText = table.Column<string>(type: "text", nullable: false),
                    Provider = table.Column<string>(type: "text", nullable: false),
                    QueriedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiQueryLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AiQueryLogs_VisitorSessions_VisitorSessionId",
                        column: x => x.VisitorSessionId,
                        principalTable: "VisitorSessions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_PageViewLogs_VisitorSessionId",
                table: "PageViewLogs",
                column: "VisitorSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkClickLogs_VisitorSessionId",
                table: "LinkClickLogs",
                column: "VisitorSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_AiQueryLogs_VisitorSessionId",
                table: "AiQueryLogs",
                column: "VisitorSessionId");

            migrationBuilder.AddForeignKey(
                name: "FK_LinkClickLogs_VisitorSessions_VisitorSessionId",
                table: "LinkClickLogs",
                column: "VisitorSessionId",
                principalTable: "VisitorSessions",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PageViewLogs_VisitorSessions_VisitorSessionId",
                table: "PageViewLogs",
                column: "VisitorSessionId",
                principalTable: "VisitorSessions",
                principalColumn: "Id");
            
            migrationBuilder.Sql(@"
                -- 1. Generate VisitorSessions for existing PageViewLogs using a SHA256 Hash
                INSERT INTO ""VisitorSessions"" (""Id"", ""TrackingId"", ""StartedAt"", ""Country"", ""City"")
                SELECT gen_random_uuid(), encode(sha256(convert_to(concat(""IpAddress"", ""UserAgent""), 'utf8')), 'hex'), MIN(""ViewedAt""), MAX(""Country""), MAX(""City"")
                FROM ""PageViewLogs""
                WHERE ""IpAddress"" IS NOT NULL
                GROUP BY ""IpAddress"", ""UserAgent"";
                -- 2. Link historical PageViewLogs to the newly generated VisitorSessions
                UPDATE ""PageViewLogs"" p
                SET ""VisitorSessionId"" = v.""Id""
                FROM ""VisitorSessions"" v
                WHERE v.""TrackingId"" = encode(sha256(convert_to(concat(p.""IpAddress"", p.""UserAgent""), 'utf8')), 'hex');
                -- 3. Link historical LinkClickLogs to the VisitorSessions
                UPDATE ""LinkClickLogs"" l
                SET ""VisitorSessionId"" = v.""Id""
                FROM ""VisitorSessions"" v
                WHERE v.""TrackingId"" = encode(sha256(convert_to(concat(l.""IpAddress"", l.""UserAgent""), 'utf8')), 'hex');
            ");

            // DROP COLUMNS LAST!
            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "PageViewLogs");

            migrationBuilder.DropColumn(
                name: "UserAgent",
                table: "PageViewLogs");

            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "LinkClickLogs");

            migrationBuilder.DropColumn(
                name: "UserAgent",
                table: "LinkClickLogs");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LinkClickLogs_VisitorSessions_VisitorSessionId",
                table: "LinkClickLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_PageViewLogs_VisitorSessions_VisitorSessionId",
                table: "PageViewLogs");

            migrationBuilder.DropTable(
                name: "AiQueryLogs");

            migrationBuilder.DropTable(
                name: "VisitorSessions");

            migrationBuilder.DropIndex(
                name: "IX_PageViewLogs_VisitorSessionId",
                table: "PageViewLogs");

            migrationBuilder.DropIndex(
                name: "IX_LinkClickLogs_VisitorSessionId",
                table: "LinkClickLogs");

            migrationBuilder.DropColumn(
                name: "VisitorSessionId",
                table: "PageViewLogs");

            migrationBuilder.DropColumn(
                name: "VisitorSessionId",
                table: "LinkClickLogs");

            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "PageViewLogs",
                type: "character varying(45)",
                maxLength: 45,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserAgent",
                table: "PageViewLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "LinkClickLogs",
                type: "character varying(45)",
                maxLength: 45,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserAgent",
                table: "LinkClickLogs",
                type: "text",
                nullable: true);
        }
    }
}
