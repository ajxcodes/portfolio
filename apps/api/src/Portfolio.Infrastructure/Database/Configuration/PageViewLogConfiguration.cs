using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Analytics;

namespace Portfolio.Infrastructure.Database.Configuration;

public class PageViewLogConfiguration : IEntityTypeConfiguration<PageViewLog>
{
    public void Configure(EntityTypeBuilder<PageViewLog> builder)
    {
        builder.HasKey(pv => pv.Id);
        
        builder.Property(pv => pv.ReferrerSource)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(pv => pv.ViewedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
            

        
        builder.Property(pv => pv.Country)
            .HasMaxLength(100);
            
        builder.Property(pv => pv.City)
            .HasMaxLength(100);
    }
}
