using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Resume;

namespace Portfolio.Infrastructure.Database.Configuration;

public class SkillConfiguration : IEntityTypeConfiguration<Skill>
{
    public void Configure(EntityTypeBuilder<Skill> builder)
    {
        builder.HasKey(s => s.Id);
        
        builder.Property(s => s.SkillName)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(s => s.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(0);

        // Relationships
        builder.HasOne(s => s.Category)
            .WithMany(sc => sc.Skills)
            .HasForeignKey(s => s.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
