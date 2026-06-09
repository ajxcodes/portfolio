using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Blog;
using Portfolio.Infrastructure.Database.Converters;

namespace Portfolio.Infrastructure.Database.Configuration;

public class SyndicationPlatformConfiguration : IEntityTypeConfiguration<SyndicationPlatform>
{
    public void Configure(EntityTypeBuilder<SyndicationPlatform> builder)
    {
        builder.HasKey(sp => sp.Id);
        
        builder.Property(sp => sp.Name)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(sp => sp.KeyIdentifier)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(sp => sp.ApiKey)
            .HasMaxLength(1024)
            .HasConversion<AesEncryptionConverter>();

        builder.Property(sp => sp.PublisherId)
            .HasMaxLength(256);
            
        builder.Property(sp => sp.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasIndex(sp => sp.Name).IsUnique();
        builder.HasIndex(sp => sp.KeyIdentifier).IsUnique();
    }
}
