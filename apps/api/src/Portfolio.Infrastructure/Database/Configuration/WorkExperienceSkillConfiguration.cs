using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Resume;

namespace Portfolio.Infrastructure.Database.Configuration;

public class WorkExperienceSkillConfiguration : IEntityTypeConfiguration<WorkExperienceSkill>
{
    public void Configure(EntityTypeBuilder<WorkExperienceSkill> builder)
    {
        builder.HasKey(wes => new { wes.WorkExperienceId, wes.SkillId });

        // Relationships
        builder.HasOne(wes => wes.WorkExperience)
            .WithMany(we => we.WorkExperienceSkills)
            .HasForeignKey(wes => wes.WorkExperienceId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasOne(wes => wes.Skill)
            .WithMany(s => s.WorkExperienceSkills)
            .HasForeignKey(wes => wes.SkillId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
