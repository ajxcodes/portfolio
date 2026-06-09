using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Portfolio.Domain.Blog;
using Portfolio.Domain.Resume;
using Portfolio.Domain.Analytics;
using Portfolio.Domain.Audit;

namespace Portfolio.Infrastructure.Database.Contexts;

public class PortfolioDbContext(DbContextOptions options, IHttpContextAccessor? httpContextAccessor = null) : DbContext(options)
{
    private readonly IHttpContextAccessor? _httpContextAccessor = httpContextAccessor;

    public DbSet<Post> Posts { get; set; } = null!;
    public DbSet<ResumeProfile> ResumeProfiles { get; set; } = null!;
    public DbSet<ResumeProfileLinkType> ResumeProfileLinkTypes { get; set; } = null!;
    public DbSet<ResumeProfileLink> ResumeProfileLinks { get; set; } = null!;
    public DbSet<LinkClickLog> LinkClickLogs { get; set; } = null!;
    public DbSet<PageViewLog> PageViewLogs { get; set; } = null!;
    public DbSet<SkillCategory> SkillCategories { get; set; } = null!;
    public DbSet<Skill> Skills { get; set; } = null!;
    public DbSet<WorkExperience> WorkExperiences { get; set; } = null!;
    public DbSet<ExperienceHighlight> ExperienceHighlights { get; set; } = null!;
    public DbSet<WorkExperienceSkill> WorkExperienceSkills { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;
    public DbSet<Tag> Tags { get; set; } = null!;
    public DbSet<PostTag> PostTags { get; set; } = null!;
    public DbSet<SyndicationPlatform> SyndicationPlatforms { get; set; } = null!;
    public DbSet<PostSyndication> PostSyndications { get; set; } = null!;

    public override int SaveChanges()
    {
        OnBeforeSaveChanges();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        OnBeforeSaveChanges();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void OnBeforeSaveChanges()
    {
        var actor = "System";
        try
        {
            var user = _httpContextAccessor?.HttpContext?.User;
            if (user != null)
            {
                var emailClaim = user.FindFirst("email")?.Value ?? user.FindFirst(ClaimTypes.Email)?.Value;
                if (!string.IsNullOrEmpty(emailClaim))
                {
                    actor = emailClaim;
                }
                else if (user.Identity?.IsAuthenticated == true)
                {
                    actor = user.Identity.Name ?? "AuthenticatedUser";
                }
            }
        }
        catch
        {
            // Fallback during migrations or local CLI commands
        }

        var auditEntries = new List<AuditLog>();
        
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                continue;

            var changes = new Dictionary<string, object?>();
            var action = entry.State switch
            {
                EntityState.Added => "INSERT",
                EntityState.Modified => "UPDATE",
                EntityState.Deleted => "DELETE",
                _ => "UNKNOWN"
            };

            bool IsSensitiveProperty(Microsoft.EntityFrameworkCore.ChangeTracking.PropertyEntry prop)
            {
                var name = prop.Metadata.Name;
                if (name.Contains("ApiKey", StringComparison.OrdinalIgnoreCase) || 
                    name.Contains("Secret", StringComparison.OrdinalIgnoreCase) || 
                    name.Contains("Password", StringComparison.OrdinalIgnoreCase))
                    return true;
                
                var converter = prop.Metadata.GetValueConverter();
                return converter != null && converter.GetType().Name.Contains("Encryption");
            }

            if (entry.State == EntityState.Added)
            {
                foreach (var prop in entry.Properties)
                {
                    changes[prop.Metadata.Name] = IsSensitiveProperty(prop) ? "***REDACTED***" : prop.CurrentValue;
                }
            }
            else if (entry.State == EntityState.Deleted)
            {
                foreach (var prop in entry.Properties)
                {
                    changes[prop.Metadata.Name] = IsSensitiveProperty(prop) ? "***REDACTED***" : prop.OriginalValue;
                }
            }
            else if (entry.State == EntityState.Modified)
            {
                foreach (var prop in entry.Properties)
                {
                    if (prop.IsModified)
                    {
                        var isSensitive = IsSensitiveProperty(prop);
                        changes[prop.Metadata.Name] = new
                        {
                            Original = isSensitive ? "***REDACTED***" : prop.OriginalValue,
                            Current = isSensitive ? "***REDACTED***" : prop.CurrentValue
                        };
                    }
                }
            }

            var changesJson = System.Text.Json.JsonSerializer.Serialize(changes);

            auditEntries.Add(new AuditLog
            {
                Id = Guid.CreateVersion7(),
                Action = $"{action} {entry.Entity.GetType().Name}",
                Actor = actor,
                Timestamp = DateTime.UtcNow,
                Changes = changesJson
            });
        }

        if (auditEntries.Count > 0)
        {
            AuditLogs.AddRange(auditEntries);
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}