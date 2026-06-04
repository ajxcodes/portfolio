using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Resume;

namespace Portfolio.Infrastructure.Database.Configuration;

public class ResumeProfileLinkTypeConfiguration : IEntityTypeConfiguration<ResumeProfileLinkType>
{
    public void Configure(EntityTypeBuilder<ResumeProfileLinkType> builder)
    {
        builder.HasKey(lt => lt.Id);
        
        builder.Property(lt => lt.Name)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(lt => lt.KeyIdentifier)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(lt => lt.Name).IsUnique();
        builder.HasIndex(lt => lt.KeyIdentifier).IsUnique();
    }
}
