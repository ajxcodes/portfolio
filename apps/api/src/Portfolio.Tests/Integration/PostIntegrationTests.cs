using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.Application.Blog.Responses;
using Portfolio.Domain.Blog;
using Microsoft.AspNetCore.Mvc.Testing;
using Portfolio.Infrastructure.Database.Contexts;
using Portfolio.Tests.Infrastructure;
using Portfolio.Tests.Extensions;
using Portfolio.Application.AI;
using Portfolio.Application.Blog.Requests;
using NSubstitute;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Integration;

[Collection("SharedDbCollection")]
public class PostIntegrationTests
{
    private readonly DbTestFixture _fixture;
    private readonly HttpClient _client;
    private readonly IAiChatService _aiServiceMock;
    private readonly WebApplicationFactory<Program> _factory;

    public PostIntegrationTests(DbTestFixture fixture)
    {
        _fixture = fixture;
        _aiServiceMock = Substitute.For<IAiChatService>();
        
        _factory = _fixture.Factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IAiChatService));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }
                services.AddSingleton(_aiServiceMock);
            });
        });

        _client = _factory.CreateClient();
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

    [Fact]
    public async Task CreateAsync_ReturnsCreatedPost()
    {
        var request = new CreatePostRequest
        {
            Title = "Integration Test",
            Slug = "integration-test",
            Summary = "Integration summary",
            Content = "Integration content",
            Visible = true,
            CanonicalUrl = null
        };

        var response = await _client.PostAsJsonAsync("/api/blog/posts", request);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<PostResponse>();
        result.ShouldNotBeNull();
        result.Title.ShouldBe("Integration Test");
        result.Slug.ShouldBe("integration-test");

        // Clean up
        using var cleanScope = _fixture.Factory.Services.CreateScope();
        var cleanContext = cleanScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        var dbPost = await cleanContext.Posts.FindAsync(result.Id);
        if (dbPost != null)
        {
            cleanContext.Posts.Remove(dbPost);
            await cleanContext.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task UpdateAsync_ReturnsUpdatedPost()
    {
        // Arrange
        using var scope = _fixture.Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        var post = new Post
        {
            Id = Guid.NewGuid(),
            Slug = "old-slug",
            Title = "Old Title",
            Content = "Old Content",
            PostedBy = "author",
            DatePosted = DateTime.UtcNow
        };
        context.Posts.Add(post);
        await context.SaveChangesAsync();

        var updateRequest = new UpdatePostRequest
        {
            Title = "New Title",
            Slug = "new-slug",
            Summary = "New Summary",
            Content = "New Content",
            Visible = false,
            CanonicalUrl = "https://new-url.com"
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/blog/posts/{post.Id}", updateRequest);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<PostResponse>();
        
        // Assert
        result.ShouldNotBeNull();
        result.Title.ShouldBe("New Title");
        result.Slug.ShouldBe("new-slug");
        result.Visible.ShouldBeFalse();

        // Clean up
        using var cleanScope = _fixture.Factory.Services.CreateScope();
        var cleanContext = cleanScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        var dbPost = await cleanContext.Posts.FindAsync(post.Id);
        if (dbPost != null)
        {
            cleanContext.Posts.Remove(dbPost);
            await cleanContext.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task DeleteAsync_RemovesPost()
    {
        // Arrange
        using var scope = _fixture.Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        var post = new Post
        {
            Id = Guid.NewGuid(),
            Slug = "delete-slug",
            Title = "Delete Title",
            Content = "Delete Content",
            PostedBy = "author",
            DatePosted = DateTime.UtcNow
        };
        context.Posts.Add(post);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.DeleteAsync($"/api/blog/posts/{post.Id}");
        response.EnsureSuccessStatusCode();

        // Assert
        using var verifyScope = _fixture.Factory.Services.CreateScope();
        var verifyContext = verifyScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        var dbPost = await verifyContext.Posts.FindAsync(post.Id);
        dbPost.ShouldBeNull();
    }

    [Fact]
    public async Task GenerateMetadataAsync_ReturnsGeneratedMetadata()
    {
        // Arrange
        var request = new GenerateMetadataRequest
        {
            Title = "My AI integration post",
            Content = "Hello from integration test!"
        };

        _aiServiceMock.AskQuestionAsync(Arg.Any<string>(), Arg.Any<string>()).Returns("AI generated string");

        // Act
        var response = await _client.PostAsJsonAsync("/api/blog/posts/generate-metadata", request);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<GenerateMetadataResponse>();

        // Assert
        result.ShouldNotBeNull();
        result.Summary.ShouldBe("AI generated string");
        result.Slug.ShouldBe("ai-generated-string");
    }
}
