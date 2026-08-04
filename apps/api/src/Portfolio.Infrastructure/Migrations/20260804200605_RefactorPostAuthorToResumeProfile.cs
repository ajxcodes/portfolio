using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Portfolio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RefactorPostAuthorToResumeProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PostedBy",
                table: "Posts");

            migrationBuilder.AddColumn<Guid>(
                name: "ResumeProfileId",
                table: "Posts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            // Data migration: assign existing posts to the first active ResumeProfile.
            // If no ResumeProfile exists but we have Posts, create a fallback profile.
            migrationBuilder.Sql(@"
                DO $$
                DECLARE
                    default_profile_id uuid;
                BEGIN
                    SELECT ""Id"" INTO default_profile_id FROM ""ResumeProfiles"" ORDER BY ""IsActive"" DESC LIMIT 1;
                    
                    IF default_profile_id IS NULL AND EXISTS (SELECT 1 FROM ""Posts"") THEN
                        default_profile_id := gen_random_uuid();
                        INSERT INTO ""ResumeProfiles"" (""Id"", ""Name"", ""Title"", ""Intro"", ""PhotoUrlLight"", ""PhotoUrlDark"", ""IsActive"", ""UpdatedAt"")
                        VALUES (default_profile_id, 'System Generated', 'Author', '', '', '', true, NOW());
                    END IF;

                    IF default_profile_id IS NOT NULL THEN
                        UPDATE ""Posts"" SET ""ResumeProfileId"" = default_profile_id;
                    END IF;
                END $$;
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_ResumeProfileId",
                table: "Posts",
                column: "ResumeProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_ResumeProfiles_ResumeProfileId",
                table: "Posts",
                column: "ResumeProfileId",
                principalTable: "ResumeProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Posts_ResumeProfiles_ResumeProfileId",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_Posts_ResumeProfileId",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "ResumeProfileId",
                table: "Posts");

            migrationBuilder.AddColumn<string>(
                name: "PostedBy",
                table: "Posts",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
