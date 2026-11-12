using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Content;

namespace Portfolio.Infrastructure.Database.Configuration;

public class PostProjectConfiguration : IEntityTypeConfiguration<PostProject>
{
    public void Configure(EntityTypeBuilder<PostProject> builder)
    {
        builder.HasKey(pp => new { pp.PostId, pp.ProjectId });

        // Relationships
        builder.HasOne(pp => pp.Post)
            .WithMany(b => b.PostProjects)
            .HasForeignKey(pp => pp.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pp => pp.Project)
            .WithMany(p => p.PostProjects)
            .HasForeignKey(pp => pp.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // The composite primary key index only covers PostId-prefixed lookups,
        // so the project side gets its own index.
        builder.HasIndex(pp => pp.ProjectId);
    }
}
