using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.Domain.Resume;
using Portfolio.Infrastructure.Database.Contexts;
using Portfolio.Tests.Infrastructure;
using Portfolio.Tests.Extensions;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Integration;

[Collection("SharedDbCollection")]
public class ResumeIntegrationTests
{
    private readonly DbTestFixture _fixture;
    private readonly HttpClient _client;

    public ResumeIntegrationTests(DbTestFixture fixture)
    {
        _fixture = fixture;
        _client = _fixture.Factory.CreateClient();
    }

    [Fact]
    public async Task ActivateProfileEndpoint_DeactivatesOtherProfiles()
    {
        // Arrange
        using var scope = _fixture.Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();

        // Clean up any existing profiles first to avoid UQ_ActiveResumeProfile conflicts
        context.ResumeProfiles.RemoveRange(context.ResumeProfiles);
        await context.SaveChangesAsync();

        var p1 = new ResumeProfile { Id = Guid.NewGuid(), Name = "Profile 1", IsActive = true, Title = "Dev 1", Intro = "A" };
        var p2 = new ResumeProfile { Id = Guid.NewGuid(), Name = "Profile 2", IsActive = false, Title = "Dev 2", Intro = "B" };
        context.ResumeProfiles.AddRange(p1, p2);
        await context.SaveChangesAsync();

        // Act (Activate profile 2)
        var response = await _client.PostAsync($"/api/resume/{p2.Id}/activate", null);
        await response.EnsureSuccessOrReportErrorAsync();

        // Assert
        using var checkScope = _fixture.Factory.Services.CreateScope();
        var checkContext = checkScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        
        var updatedP1 = await checkContext.ResumeProfiles.FindAsync(p1.Id);
        var updatedP2 = await checkContext.ResumeProfiles.FindAsync(p2.Id);

        updatedP1!.IsActive.ShouldBeFalse();
        updatedP2!.IsActive.ShouldBeTrue();

        // Clean up
        checkContext.ResumeProfiles.RemoveRange(updatedP1, updatedP2);
        await checkContext.SaveChangesAsync();
    }

    [Fact]
    public async Task Database_EnforcesSingleActiveProfileUniqueConstraint()
    {
        // Arrange
        using var scope = _fixture.Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();

        // Clean up any existing profiles first to avoid UQ_ActiveResumeProfile conflicts
        context.ResumeProfiles.RemoveRange(context.ResumeProfiles);
        await context.SaveChangesAsync();

        var p1 = new ResumeProfile { Id = Guid.NewGuid(), Name = "Profile 1", IsActive = true, Title = "Dev 1", Intro = "A" };
        var p2 = new ResumeProfile { Id = Guid.NewGuid(), Name = "Profile 2", IsActive = true, Title = "Dev 2", Intro = "B" };
        
        context.ResumeProfiles.AddRange(p1, p2);

        // Act & Assert
        await Should.ThrowAsync<DbUpdateException>(async () =>
        {
            await context.SaveChangesAsync();
        });

        // Detach to avoid EF tracking errors in cleanup/other tests
        context.Entry(p1).State = EntityState.Detached;
        context.Entry(p2).State = EntityState.Detached;
    }

    [Fact]
    public async Task PrepareDownloadAsync_ReturnsOk_WithDownloadUrl()
    {
        // Arrange
        using var scope = _fixture.Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();

        // Clean up any existing profiles first to avoid UQ_ActiveResumeProfile conflicts
        context.ResumeProfiles.RemoveRange(context.ResumeProfiles);
        await context.SaveChangesAsync();

        var activeProfile = new ResumeProfile 
        { 
            Id = Guid.NewGuid(), 
            Name = "John PDF Tester", 
            IsActive = true, 
            Title = "Senior PDF Architect", 
            Intro = "Hello from integration testing PDF output generation." 
        };
        context.ResumeProfiles.Add(activeProfile);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.PostAsync("/api/resume/active/download", null);
        
        // Assert
        response.StatusCode.ShouldBe(System.Net.HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.ShouldContain("downloadUrl");

        // Clean up
        using var cleanupScope = _fixture.Factory.Services.CreateScope();
        var cleanupContext = cleanupScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        var toRemove = await cleanupContext.ResumeProfiles.FindAsync(activeProfile.Id);
        if (toRemove != null)
        {
            cleanupContext.ResumeProfiles.Remove(toRemove);
            await cleanupContext.SaveChangesAsync();
        }
    }
    [Fact]
    public async Task DeleteProfileEndpoint_DeletesSuccessfully()
    {
        // Arrange
        using var scope = _fixture.Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();

        var p = new ResumeProfile { Id = Guid.NewGuid(), Name = "Profile to Delete", IsActive = false, Title = "Dev", Intro = "A" };
        context.ResumeProfiles.Add(p);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.DeleteAsync($"/api/resume/{p.Id}");

        // Assert
        response.StatusCode.ShouldBe(System.Net.HttpStatusCode.NoContent);

        using var checkScope = _fixture.Factory.Services.CreateScope();
        var checkContext = checkScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        var deletedProfile = await checkContext.ResumeProfiles.FindAsync(p.Id);
        deletedProfile.ShouldBeNull();
    }

    [Fact]
    public async Task DeleteProfileEndpoint_ReturnsBadRequest_ForActiveProfile()
    {
        // Arrange
        using var scope = _fixture.Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();

        // Clean up existing to safely insert an active profile
        context.ResumeProfiles.RemoveRange(context.ResumeProfiles);
        await context.SaveChangesAsync();

        var p = new ResumeProfile { Id = Guid.NewGuid(), Name = "Active Profile to Delete", IsActive = true, Title = "Dev", Intro = "A" };
        context.ResumeProfiles.Add(p);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.DeleteAsync($"/api/resume/{p.Id}");

        // Assert
        response.StatusCode.ShouldBe(System.Net.HttpStatusCode.BadRequest);
        var content = await response.Content.ReadAsStringAsync();
        content.ShouldContain("Cannot delete the currently active profile");
        
        // Clean up
        using var cleanupScope = _fixture.Factory.Services.CreateScope();
        var cleanupContext = cleanupScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        var toRemove = await cleanupContext.ResumeProfiles.FindAsync(p.Id);
        if (toRemove != null)
        {
            cleanupContext.ResumeProfiles.Remove(toRemove);
            await cleanupContext.SaveChangesAsync();
        }
    }
}
