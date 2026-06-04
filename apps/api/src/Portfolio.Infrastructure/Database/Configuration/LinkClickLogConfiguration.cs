using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Analytics;

namespace Portfolio.Infrastructure.Database.Configuration;

public class LinkClickLogConfiguration : IEntityTypeConfiguration<LinkClickLog>
{
    public void Configure(EntityTypeBuilder<LinkClickLog> builder)
    {
        builder.HasKey(c => c.Id);
        
        builder.Property(c => c.ClickedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
        builder.Property(c => c.IpAddress)
            .HasMaxLength(45);
            
        builder.Property(c => c.UserAgent);
        
        builder.Property(c => c.ReferrerSource)
            .HasMaxLength(100);
            
        builder.Property(c => c.Country)
            .HasMaxLength(100);
            
        builder.Property(c => c.City)
            .HasMaxLength(100);

        // Relationships
        builder.HasOne(c => c.Link)
            .WithMany(l => l.Clicks)
            .HasForeignKey(c => c.LinkId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
