using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Resume;

namespace Portfolio.Infrastructure.Database.Configuration;

public class ExperienceHighlightConfiguration : IEntityTypeConfiguration<ExperienceHighlight>
{
    public void Configure(EntityTypeBuilder<ExperienceHighlight> builder)
    {
        builder.HasKey(eh => eh.Id);
        
        builder.Property(eh => eh.ResultText)
            .IsRequired();
            
        builder.Property(eh => eh.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(0);

        // Relationships
        builder.HasOne(eh => eh.Experience)
            .WithMany(we => we.Highlights)
            .HasForeignKey(eh => eh.ExperienceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
