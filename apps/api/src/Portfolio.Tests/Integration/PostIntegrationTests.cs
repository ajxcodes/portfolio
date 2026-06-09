using Microsoft.Extensions.DependencyInjection;
using Portfolio.Application.Blog.Responses;
using Portfolio.Domain.Blog;
using Portfolio.Infrastructure.Database.Contexts;
using Portfolio.Tests.Infrastructure;
using Portfolio.Tests.Extensions;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Integration;

public class PostIntegrationTests : IClassFixture<DbTestFixture>
{
    private readonly DbTestFixture _fixture;
    private readonly HttpClient _client;

    public PostIntegrationTests(DbTestFixture fixture)
    {
        _fixture = fixture;
        _client = _fixture.Factory.CreateClient();
    }

    [Fact]
    public async Task ListAsync_ReturnsAllStoredPosts()
    {
        // Arrange
        using var scope = _fixture.Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();

        var post1 = new Post
        {
            Id = Guid.NewGuid(),
            Slug = "first-post",
            Title = "First Title",
            Content = "Content 1",
            PostedBy = "author",
            DatePosted = DateTime.UtcNow
        };
        var post2 = new Post
        {
            Id = Guid.NewGuid(),
            Slug = "second-post",
            Title = "Second Title",
            Content = "Content 2",
            PostedBy = "author",
            DatePosted = DateTime.UtcNow
        };

        context.Posts.AddRange(post1, post2);
        await context.SaveChangesAsync();

        // Act
        var result = await _client.GetFromJsonOrReportErrorAsync<List<PostResponse>>("/api/blog/posts");

        // Assert
        result.ShouldNotBeNull();
        result.Any(r => r.Slug == "first-post").ShouldBeTrue();
        result.Any(r => r.Slug == "second-post").ShouldBeTrue();

        // Clean up
        using var cleanScope = _fixture.Factory.Services.CreateScope();
        var cleanContext = cleanScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        var dbPost1 = await cleanContext.Posts.FindAsync(post1.Id);
        var dbPost2 = await cleanContext.Posts.FindAsync(post2.Id);
        if (dbPost1 != null) cleanContext.Posts.Remove(dbPost1);
        if (dbPost2 != null) cleanContext.Posts.Remove(dbPost2);
        await cleanContext.SaveChangesAsync();
    }

    [Fact]
    public async Task GetAsync_ReturnsCorrectPost_WhenIdExists()
    {
        // Arrange
        using var scope = _fixture.Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();

        var targetId = Guid.NewGuid();
        var post = new Post
        {
            Id = targetId,
            Slug = "target-post",
            Title = "Target Title",
            Content = "Target Content",
            PostedBy = "author",
            DatePosted = DateTime.UtcNow
        };

        context.Posts.Add(post);
        await context.SaveChangesAsync();

        // Act
        var result = await _client.GetFromJsonOrReportErrorAsync<PostResponse>($"/api/blog/posts/{targetId}");

        // Assert
        result.ShouldNotBeNull();
        result.Id.ShouldBe(targetId);
        result.Slug.ShouldBe("target-post");
        result.Title.ShouldBe("Target Title");

        // Clean up
        using var cleanScope = _fixture.Factory.Services.CreateScope();
        var cleanContext = cleanScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        var dbPost = await cleanContext.Posts.FindAsync(targetId);
        if (dbPost != null)
        {
            cleanContext.Posts.Remove(dbPost);
            await cleanContext.SaveChangesAsync();
        }
    }
}
