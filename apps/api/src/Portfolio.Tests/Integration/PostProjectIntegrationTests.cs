using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.Application.Content.Requests;
using Portfolio.Application.Content.Responses;
using Portfolio.Domain.Content;
using Portfolio.Domain.Resume;
using Portfolio.Infrastructure.Database.Contexts;
using Portfolio.Tests.Infrastructure;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Integration;

[Collection("SharedDbCollection")]
public class PostProjectIntegrationTests
{
    private readonly DbTestFixture _fixture;
    private readonly HttpClient _client;

    public PostProjectIntegrationTests(DbTestFixture fixture)
    {
        _fixture = fixture;
        _client = _fixture.Factory.CreateClient();
    }

    [Fact]
    public async Task AttachReadDetach_PersistsAndRemovesTheJoinRow()
    {
        var profileId = await CreateProfileAsync();
        var postId = await CreatePostAsync(profileId);
        var projectId = await CreateProjectAsync(profileId);

        try
        {
            var attachResponse = await _client.PostAsync($"/api/blog/posts/{postId}/projects/{projectId}", null);
            attachResponse.EnsureSuccessStatusCode();

            using (var verifyScope = _fixture.Factory.Services.CreateScope())
            {
                var verifyContext = verifyScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
                (await verifyContext.PostProjects.CountAsync(pp => pp.PostId == postId && pp.ProjectId == projectId)).ShouldBe(1);
            }

            var post = await _client.GetFromJsonAsync<ContentResponse>($"/api/blog/posts/{postId}");
            post.ShouldNotBeNull();
            post!.RelatedProjects.ShouldContain(p => p.Id == projectId);

            var detachResponse = await _client.DeleteAsync($"/api/blog/posts/{postId}/projects/{projectId}");
            detachResponse.EnsureSuccessStatusCode();

            using (var verifyScope = _fixture.Factory.Services.CreateScope())
            {
                var verifyContext = verifyScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
                (await verifyContext.PostProjects.CountAsync(pp => pp.PostId == postId)).ShouldBe(0);
            }
        }
        finally
        {
            await _client.DeleteAsync($"/api/blog/posts/{postId}");
            await _client.DeleteAsync($"/api/projects/{projectId}");
        }
    }

    [Fact]
    public async Task DeletingTheProject_CascadesAndRemovesTheJoinRow()
    {
        var profileId = await CreateProfileAsync();
        var postId = await CreatePostAsync(profileId);
        var projectId = await CreateProjectAsync(profileId);

        var attachResponse = await _client.PostAsync($"/api/blog/posts/{postId}/projects/{projectId}", null);
        attachResponse.EnsureSuccessStatusCode();

        try
        {
            var deleteResponse = await _client.DeleteAsync($"/api/projects/{projectId}");
            deleteResponse.EnsureSuccessStatusCode();

            using var verifyScope = _fixture.Factory.Services.CreateScope();
            var verifyContext = verifyScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
            (await verifyContext.PostProjects.CountAsync(pp => pp.ProjectId == projectId)).ShouldBe(0);
        }
        finally
        {
            await _client.DeleteAsync($"/api/blog/posts/{postId}");
        }
    }

    [Fact]
    public async Task DeletingTheBlogPost_CascadesAndRemovesTheJoinRow()
    {
        var profileId = await CreateProfileAsync();
        var postId = await CreatePostAsync(profileId);
        var projectId = await CreateProjectAsync(profileId);

        var attachResponse = await _client.PostAsync($"/api/blog/posts/{postId}/projects/{projectId}", null);
        attachResponse.EnsureSuccessStatusCode();

        try
        {
            var deleteResponse = await _client.DeleteAsync($"/api/blog/posts/{postId}");
            deleteResponse.EnsureSuccessStatusCode();

            using var verifyScope = _fixture.Factory.Services.CreateScope();
            var verifyContext = verifyScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
            (await verifyContext.PostProjects.CountAsync(pp => pp.PostId == postId)).ShouldBe(0);
        }
        finally
        {
            await _client.DeleteAsync($"/api/projects/{projectId}");
        }
    }

    [Fact]
    public async Task UpdateStartDate_SetsTheDate_AndDoesNotDuplicateProjectLinks()
    {
        var profileId = await CreateProfileAsync();
        var projectId = await CreateProjectAsync(profileId);

        try
        {
            var updateResponse = await _client.PutAsJsonAsync($"/api/projects/{projectId}/start-date",
                new UpdateStartDateRequest { StartDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc) });
            updateResponse.EnsureSuccessStatusCode();

            var updated = await updateResponse.Content.ReadFromJsonAsync<ContentResponse>();
            updated.ShouldNotBeNull();
            updated!.StartDate.ShouldBe(new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc));

            using var verifyScope = _fixture.Factory.Services.CreateScope();
            var verifyContext = verifyScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
            (await verifyContext.ProjectLinks.CountAsync(l => l.ProjectId == projectId)).ShouldBe(1);
        }
        finally
        {
            await _client.DeleteAsync($"/api/projects/{projectId}");
        }
    }

    private async Task<Guid> CreateProfileAsync()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        var profile = new ResumeProfile { Id = Guid.NewGuid(), Name = $"post-project-author-{Guid.NewGuid():N}" };
        context.ResumeProfiles.Add(profile);
        await context.SaveChangesAsync();
        return profile.Id;
    }

    private async Task<Guid> CreatePostAsync(Guid profileId)
    {
        var create = new CreateContentRequest
        {
            Title = "Related Project Post",
            Slug = $"related-project-post-{Guid.NewGuid():N}",
            Summary = "Summary",
            Content = "Content",
            ResumeProfileId = profileId,
            Visible = true
        };

        var createResponse = await _client.PostAsJsonAsync("/api/blog/posts", create);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ContentResponse>();
        created.ShouldNotBeNull();
        return created!.Id;
    }

    private async Task<Guid> CreateProjectAsync(Guid profileId)
    {
        var create = new CreateContentRequest
        {
            Title = "Related Project",
            Slug = $"related-project-{Guid.NewGuid():N}",
            Summary = "Summary",
            Content = "README",
            ResumeProfileId = profileId,
            Visible = true,
            ProjectLinks = new List<ProjectLinkRequest>
            {
                new() { Type = "github", Url = "https://github.com/example/related-project", Label = "GitHub" }
            }
        };

        var createResponse = await _client.PostAsJsonAsync("/api/projects", create);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ContentResponse>();
        created.ShouldNotBeNull();
        return created!.Id;
    }
}
