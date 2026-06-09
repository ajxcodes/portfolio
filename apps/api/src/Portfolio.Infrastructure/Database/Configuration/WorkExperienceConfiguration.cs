using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Resume;

namespace Portfolio.Infrastructure.Database.Configuration;

public class WorkExperienceConfiguration : IEntityTypeConfiguration<WorkExperience>
{
    public void Configure(EntityTypeBuilder<WorkExperience> builder)
    {
        builder.HasKey(we => we.Id);
        
        builder.Property(we => we.Company)
            .IsRequired()
            .HasMaxLength(150);
            
        builder.Property(we => we.Role)
            .IsRequired()
            .HasMaxLength(150);
            
        builder.Property(we => we.Period)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(we => we.Location)
            .HasMaxLength(150);
            
        builder.Property(we => we.IsPrevious)
            .IsRequired()
            .HasDefaultValue(false);
            
        builder.Property(we => we.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(0);

        // Relationships
        builder.HasOne(we => we.Profile)
            .WithMany(p => p.WorkExperiences)
            .HasForeignKey(we => we.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
