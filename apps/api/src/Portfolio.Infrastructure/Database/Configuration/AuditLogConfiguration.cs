using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Portfolio.Domain.Audit;

namespace Portfolio.Infrastructure.Database.Configuration;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(al => al.Id);
        
        builder.Property(al => al.Action)
            .IsRequired()
            .HasMaxLength(150);
            
        builder.Property(al => al.Actor)
            .IsRequired()
            .HasMaxLength(150);
            
        builder.Property(al => al.Timestamp)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
        builder.Property(al => al.Changes)
            .HasColumnType("jsonb")
            .IsRequired(false);
    }
}
