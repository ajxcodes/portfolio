using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Portfolio.Domain.Blog;
using Portfolio.Domain.Resume;
using Portfolio.Domain.Analytics;
using Portfolio.Domain.Audit;

namespace Portfolio.Infrastructure.Database.Contexts;

public class PortfolioDbContext(DbContextOptions options) : DbContext(options)
{
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}