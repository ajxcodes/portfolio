using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Blog;

namespace Portfolio.Infrastructure.Database.Configuration;

public class PostConfiguration : IEntityTypeConfiguration<Post>
{
    public void Configure(EntityTypeBuilder<Post> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Slug).IsRequired();
        builder.Property(p => p.Title).IsRequired();
        builder.Property(p => p.Summary);
        builder.Property(p => p.Content).IsRequired();
        builder.Property(p => p.DatePosted).IsRequired();
        builder.Property(p => p.PostedBy).IsRequired();
        builder.Property(p => p.DateModified).IsRequired(false);
        builder.Property(p => p.ModifiedBy).IsRequired(false);
    }
}