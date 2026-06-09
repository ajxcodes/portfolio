using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Resume;

namespace Portfolio.Infrastructure.Database.Configuration;

public class SkillCategoryConfiguration : IEntityTypeConfiguration<SkillCategory>
{
    public void Configure(EntityTypeBuilder<SkillCategory> builder)
    {
        builder.HasKey(sc => sc.Id);
        
        builder.Property(sc => sc.CategoryName)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(sc => sc.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(0);
    }
}
