using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Resume;

namespace Portfolio.Infrastructure.Database.Configuration;

public class ResumeProfileLinkConfiguration : IEntityTypeConfiguration<ResumeProfileLink>
{
    public void Configure(EntityTypeBuilder<ResumeProfileLink> builder)
    {
        builder.HasKey(l => l.Id);
        
        builder.Property(l => l.Url)
            .IsRequired()
            .HasMaxLength(255);
            
        builder.Property(l => l.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Relationships
        builder.HasOne(l => l.Profile)
            .WithMany(p => p.Links)
            .HasForeignKey(l => l.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasOne(l => l.LinkType)
            .WithMany(lt => lt.Links)
            .HasForeignKey(l => l.LinkTypeId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique constraint on ProfileId + LinkTypeId
        builder.HasIndex(l => new { l.ProfileId, l.LinkTypeId })
            .HasDatabaseName("UQ_Profile_LinkType")
            .IsUnique();
    }
}
