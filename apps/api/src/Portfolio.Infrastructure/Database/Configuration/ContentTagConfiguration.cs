using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Content;

namespace Portfolio.Infrastructure.Database.Configuration;

public class ContentTagConfiguration : IEntityTypeConfiguration<ContentTag>
{
    public void Configure(EntityTypeBuilder<ContentTag> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(t => t.ContentType).IsRequired();

        builder.Property(t => t.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasIndex(t => new { t.Name, t.ContentType }).IsUnique();
    }
}
