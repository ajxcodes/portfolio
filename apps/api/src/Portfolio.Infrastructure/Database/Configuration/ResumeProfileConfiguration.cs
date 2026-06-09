using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Resume;

namespace Portfolio.Infrastructure.Database.Configuration;

public class ResumeProfileConfiguration : IEntityTypeConfiguration<ResumeProfile>
{
    public void Configure(EntityTypeBuilder<ResumeProfile> builder)
    {
        builder.HasKey(p => p.Id);
        
        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(p => p.Title)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(p => p.Intro)
            .IsRequired();
            
        builder.Property(p => p.PhotoUrlLight)
            .HasMaxLength(500)
            .HasDefaultValue("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80");
            
        builder.Property(p => p.PhotoUrlDark)
            .HasMaxLength(500)
            .HasDefaultValue("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80");
            
        builder.Property(p => p.IsActive)
            .IsRequired()
            .HasDefaultValue(false);
            
        builder.Property(p => p.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Enforce single active profile constraint via partial unique index
        builder.HasIndex(p => p.IsActive)
            .HasDatabaseName("UQ_ActiveResumeProfile")
            .IsUnique()
            .HasFilter("\"IsActive\" = TRUE");
    }
}
