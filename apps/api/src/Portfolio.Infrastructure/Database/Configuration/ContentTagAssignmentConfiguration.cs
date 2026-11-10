using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Content;

namespace Portfolio.Infrastructure.Database.Configuration;

public class ContentTagAssignmentConfiguration : IEntityTypeConfiguration<ContentTagAssignment>
{
    public void Configure(EntityTypeBuilder<ContentTagAssignment> builder)
    {
        builder.HasKey(ct => new { ct.ContentItemId, ct.TagId });

        // Relationships
        builder.HasOne(ct => ct.ContentItem)
            .WithMany(c => c.ContentTags)
            .HasForeignKey(ct => ct.ContentItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ct => ct.ContentTag)
            .WithMany(t => t.ContentTagAssignments)
            .HasForeignKey(ct => ct.TagId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
