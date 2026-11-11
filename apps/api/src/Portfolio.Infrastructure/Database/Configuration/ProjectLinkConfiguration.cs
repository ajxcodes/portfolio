using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Content;

namespace Portfolio.Infrastructure.Database.Configuration;

public class ProjectLinkConfiguration : IEntityTypeConfiguration<ProjectLink>
{
    public void Configure(EntityTypeBuilder<ProjectLink> builder)
    {
        builder.HasKey(pl => pl.Id);

        builder.Property(pl => pl.Type)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(pl => pl.Url)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(pl => pl.Label)
            .HasMaxLength(100);

        builder.Property(pl => pl.DisplayOrder).IsRequired();

        builder.HasOne(pl => pl.Project)
            .WithMany(p => p.ProjectLinks)
            .HasForeignKey(pl => pl.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
