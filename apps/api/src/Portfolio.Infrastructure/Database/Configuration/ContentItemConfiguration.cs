using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Content;

namespace Portfolio.Infrastructure.Database.Configuration;

public class ContentItemConfiguration : IEntityTypeConfiguration<ContentItem>
{
    public void Configure(EntityTypeBuilder<ContentItem> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Slug).IsRequired();
        builder.Property(c => c.Title).IsRequired();
        builder.Property(c => c.Summary);
        builder.Property(c => c.Content).IsRequired();
        builder.Property(c => c.DatePosted).IsRequired();
        builder.Property(c => c.ResumeProfileId).IsRequired();

        builder.HasOne(c => c.ResumeProfile)
            .WithMany()
            .HasForeignKey(c => c.ResumeProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(c => c.DateModified).IsRequired(false);
        builder.Property(c => c.ModifiedBy).IsRequired(false);

        builder.HasDiscriminator<ContentType>("ContentType")
            .HasValue<BlogPost>(ContentType.Blog)
            .HasValue<Project>(ContentType.Project);
    }
}
