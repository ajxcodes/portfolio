using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.Application.Content.Requests;
using Portfolio.Application.Content.Responses;
using Portfolio.Domain.Content;
using Portfolio.Domain.Resume;
using Portfolio.Infrastructure.Database.Contexts;
using Portfolio.Tests.Infrastructure;
using Portfolio.Tests.Extensions;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Integration;

[Collection("SharedDbCollection")]
public class ProjectIntegrationTests
{
    private readonly DbTestFixture _fixture;
    private readonly HttpClient _client;

    public ProjectIntegrationTests(DbTestFixture fixture)
    {
        _fixture = fixture;
        _client = _fixture.Factory.CreateClient();
    }

    [Fact]
    public async Task UpdateAsync_ReplacesProjectLinksAndTags_WithoutException()
    {
        // Arrange
        Guid profileId;
        Guid projectId;
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
            var profile = new ResumeProfile { Id = Guid.NewGuid(), Name = $"project-author-{Guid.NewGuid():N}" };
            context.ResumeProfiles.Add(profile);
            await context.SaveChangesAsync();
            profileId = profile.Id;
        }

        var create = new CreateContentRequest
        {
            Title = "Integration Project",
            Slug = $"integration-project-{Guid.NewGuid():N}",
            Summary = "Summary",
            Content = "# README\n\nInitial",
            ResumeProfileId = profileId,
            Visible = true,
            Tags = new List<string> { "dotnet", "react" },
            ProjectLinks = new List<ProjectLinkRequest>
            {
                new() { Type = "homepage", Url = "https://example.com/home", Label = "Home" },
                new() { Type = "github", Url = "https://example.com/repo", Label = "Repo" },
                new() { Type = "store", Url = "https://example.com/store", Label = "Store" }
            }
        };

        var createResponse = await _client.PostAsJsonAsync("/api/projects", create);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ContentResponse>();
        created.ShouldNotBeNull();
        projectId = created.Id;

        try
        {
            // Act: replace links and tags (A1 regression - must not throw / must return 200)
            var update = new UpdateContentRequest
            {
                Title = "Integration Project Updated",
                Slug = create.Slug,
                Summary = "Updated summary",
                Content = "# README\n\nUpdated",
                ResumeProfileId = profileId,
                Visible = true,
                Tags = new List<string> { "react", "podman" },
                ProjectLinks = new List<ProjectLinkRequest>
                {
                    new() { Type = "github", Url = "https://example.com/repo-v2", Label = "Repo v2" },
                    new() { Type = "docs", Url = "https://example.com/docs", Label = "Docs" }
                }
            };

            var updateResponse = await _client.PutAsJsonAsync($"/api/projects/{projectId}", update);
            updateResponse.EnsureSuccessStatusCode();
            var updated = await updateResponse.Content.ReadFromJsonAsync<ContentResponse>();
            updated.ShouldNotBeNull();
            updated.Title.ShouldBe("Integration Project Updated");

            // Assert persisted state: exactly requested links and tags, no orphans
            using var verifyScope = _fixture.Factory.Services.CreateScope();
            var verifyContext = verifyScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();

            var links = await verifyContext.ProjectLinks
                .Where(l => l.ProjectId == projectId)
                .ToListAsync();
            links.Count.ShouldBe(2);
            links.ShouldContain(l => l.Type == "github" && l.Url == "https://example.com/repo-v2");
            links.ShouldContain(l => l.Type == "docs" && l.Url == "https://example.com/docs");
            links.ShouldNotContain(l => l.Url == "https://example.com/home");
            links.ShouldNotContain(l => l.Url == "https://example.com/store");

            var assignments = await verifyContext.ContentTagAssignments
                .Where(a => a.ContentItemId == projectId)
                .Include(a => a.ContentTag)
                .ToListAsync();
            assignments.Count.ShouldBe(2);
            assignments.Select(a => a.ContentTag.Name).OrderBy(n => n).ToArray()
                .ShouldBe(new[] { "podman", "react" });

            // ensure no orphaned project links at all for this project beyond the 2 (redundant but explicit)
            (await verifyContext.ProjectLinks.CountAsync(l => l.ProjectId == projectId)).ShouldBe(2);
            (await verifyContext.ContentTagAssignments.CountAsync(a => a.ContentItemId == projectId)).ShouldBe(2);
        }
        finally
        {
            await _client.DeleteAsync($"/api/projects/{projectId}");
        }
    }

    [Fact]
    public async Task DeleteAsync_RemovesProjectAndItsDependentRows()
    {
        // Arrange
        Guid profileId;
        Guid projectId;
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
            var profile = new ResumeProfile { Id = Guid.NewGuid(), Name = $"project-author-{Guid.NewGuid():N}" };
            context.ResumeProfiles.Add(profile);
            await context.SaveChangesAsync();
            profileId = profile.Id;
        }

        var create = new CreateContentRequest
        {
            Title = "Delete Me Project",
            Slug = $"delete-project-{Guid.NewGuid():N}",
            Summary = "Summary",
            Content = "Content",
            ResumeProfileId = profileId,
            Visible = true,
            Tags = new List<string> { "cleanup" },
            ProjectLinks = new List<ProjectLinkRequest>
            {
                new() { Type = "github", Url = "https://example.com/delete-me", Label = "Repo" }
            }
        };

        var createResponse = await _client.PostAsJsonAsync("/api/projects", create);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ContentResponse>();
        created.ShouldNotBeNull();
        projectId = created.Id;

        // Act
        var deleteResponse = await _client.DeleteAsync($"/api/projects/{projectId}");
        deleteResponse.EnsureSuccessStatusCode();

        // Assert
        using var verifyScope = _fixture.Factory.Services.CreateScope();
        var verifyContext = verifyScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        (await verifyContext.ContentItems.FindAsync(projectId)).ShouldBeNull();
        (await verifyContext.ProjectLinks.CountAsync(l => l.ProjectId == projectId)).ShouldBe(0);
        (await verifyContext.ContentTagAssignments.CountAsync(a => a.ContentItemId == projectId)).ShouldBe(0);
    }

    [Fact]
    public async Task Tags_AreSeparatedByContentType()
    {
        // Arrange
        Guid profileId;
        Guid blogId = Guid.Empty;
        Guid projectId = Guid.Empty;
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
            var profile = new ResumeProfile { Id = Guid.NewGuid(), Name = $"shared-tag-author-{Guid.NewGuid():N}" };
            context.ResumeProfiles.Add(profile);
            await context.SaveChangesAsync();
            profileId = profile.Id;
        }

        var sharedTag = $"shared-{Guid.NewGuid():N}";

        try
        {
            var blogReq = new CreateContentRequest
            {
                Title = "Shared Tag Blog",
                Slug = $"shared-tag-blog-{Guid.NewGuid():N}",
                Summary = "Blog",
                Content = "Blog content",
                ResumeProfileId = profileId,
                Visible = true,
                Tags = new List<string> { sharedTag }
            };
            var blogRes = await _client.PostAsJsonAsync("/api/blog/posts", blogReq);
            blogRes.EnsureSuccessStatusCode();
            var blog = await blogRes.Content.ReadFromJsonAsync<ContentResponse>();
            blog.ShouldNotBeNull();
            blogId = blog.Id;

            var projReq = new CreateContentRequest
            {
                Title = "Shared Tag Project",
                Slug = $"shared-tag-project-{Guid.NewGuid():N}",
                Summary = "Project",
                Content = "Project content",
                ResumeProfileId = profileId,
                Visible = true,
                Tags = new List<string> { sharedTag }
            };
            var projRes = await _client.PostAsJsonAsync("/api/projects", projReq);
            projRes.EnsureSuccessStatusCode();
            var project = await projRes.Content.ReadFromJsonAsync<ContentResponse>();
            project.ShouldNotBeNull();
            projectId = project.Id;

            // Assert
            using var verifyScope = _fixture.Factory.Services.CreateScope();
            var verifyContext = verifyScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
            var tags = await verifyContext.ContentTags
                .Where(t => t.Name == sharedTag)
                .ToListAsync();

            tags.Count.ShouldBe(2);
            tags.Select(t => t.ContentType).Distinct().OrderBy(t => t).ToArray()
                .ShouldBe(new[] { ContentType.Blog, ContentType.Project });
        }
        finally
        {
            if (blogId != Guid.Empty) await _client.DeleteAsync($"/api/blog/posts/{blogId}");
            if (projectId != Guid.Empty) await _client.DeleteAsync($"/api/projects/{projectId}");
        }
    }
}
