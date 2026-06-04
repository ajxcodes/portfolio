using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Blog;

namespace Portfolio.Infrastructure.Database.Configuration;

public class PostSyndicationConfiguration : IEntityTypeConfiguration<PostSyndication>
{
    public void Configure(EntityTypeBuilder<PostSyndication> builder)
    {
        builder.HasKey(ps => new { ps.PostId, ps.PlatformId });
        
        builder.Property(ps => ps.ExternalUrl)
            .IsRequired()
            .HasMaxLength(255);
            
        builder.Property(ps => ps.ExternalId)
            .HasMaxLength(100);
            
        builder.Property(ps => ps.SyndicatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Relationships
        builder.HasOne(ps => ps.Post)
            .WithMany(p => p.PostSyndications)
            .HasForeignKey(ps => ps.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ps => ps.Platform)
            .WithMany(sp => sp.PostSyndications)
            .HasForeignKey(ps => ps.PlatformId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
