using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.Domain.Blog;
using Portfolio.Infrastructure.Database.Contexts;
using Portfolio.Tests.Infrastructure;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Integration;

public class AuditIntegrationTests : IClassFixture<DbTestFixture>
{
    private readonly DbTestFixture _fixture;

    public AuditIntegrationTests(DbTestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task SaveChangesAsync_CreatesAuditLogsForInsertUpdateDelete()
    {
        // Arrange
        using var scope = _fixture.Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();

        var postId = Guid.NewGuid();
        var post = new Post
        {
            Id = postId,
            Slug = "audit-test",
            Title = "Original Title",
            Content = "Content",
            PostedBy = "admin",
            DatePosted = DateTime.UtcNow
        };

        // 1. Test Insert Auditing
        context.Posts.Add(post);
        await context.SaveChangesAsync();

        var insertAudit = context.AuditLogs
            .Where(a => a.Action.Contains("INSERT") && a.Action.Contains("Post"))
            .OrderByDescending(a => a.Timestamp)
            .FirstOrDefault();

        insertAudit.ShouldNotBeNull();
        insertAudit.Changes.ShouldContain("Original Title");
        insertAudit.Actor.ShouldNotBeNull();

        // 2. Test Update Auditing
        post.Title = "Updated Title";
        await context.SaveChangesAsync();

        var updateAudit = context.AuditLogs
            .Where(a => a.Action.Contains("UPDATE") && a.Action.Contains("Post"))
            .OrderByDescending(a => a.Timestamp)
            .FirstOrDefault();

        updateAudit.ShouldNotBeNull();
        updateAudit.Changes.ShouldContain("Original Title");
        updateAudit.Changes.ShouldContain("Updated Title");

        // 3. Test Delete Auditing
        context.Posts.Remove(post);
        await context.SaveChangesAsync();

        var deleteAudit = context.AuditLogs
            .Where(a => a.Action.Contains("DELETE") && a.Action.Contains("Post"))
            .OrderByDescending(a => a.Timestamp)
            .FirstOrDefault();

        deleteAudit.ShouldNotBeNull();
        deleteAudit.Changes.ShouldContain("Updated Title");
    }
}
