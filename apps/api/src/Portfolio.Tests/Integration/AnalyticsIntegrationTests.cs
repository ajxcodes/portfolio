using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.Api.Analytics.Controllers;
using Portfolio.Application.Analytics.Services;
using Portfolio.Domain.Analytics;
using Portfolio.Domain.Resume;
using Portfolio.Infrastructure.Database.Contexts;
using Portfolio.Tests.Infrastructure;
using Portfolio.Tests.Extensions;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Integration;

public class AnalyticsIntegrationTests : IClassFixture<DbTestFixture>
{
    private readonly DbTestFixture _fixture;
    private readonly HttpClient _client;

    public AnalyticsIntegrationTests(DbTestFixture fixture)
    {
        _fixture = fixture;
        _client = _fixture.Factory.CreateClient();
    }

    [Fact]
    public async Task PageViewsAndClicks_AreSuccessfullyLoggedAndSummarized()
    {
        // Arrange
        // 1. Log a page view
        var viewReq = new PageViewRequest
        {
            ReferrerSource = "github_readme",
            Country = "Canada",
            City = "Toronto"
        };
        var viewResponse = await _client.PostAsJsonAsync("/api/analytics/views", viewReq);
        await viewResponse.EnsureSuccessOrReportErrorAsync();

        // 2. Add seed resume profile link for click log testing
        using var scope = _fixture.Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();

        var profile = new ResumeProfile { Id = Guid.NewGuid(), Name = "AJ", Title = "Dev", Intro = "Hello" };
        var linkType = new ResumeProfileLinkType { Id = Guid.NewGuid(), Name = "LinkedIn", KeyIdentifier = "linkedin" };
        var link = new ResumeProfileLink { Id = Guid.NewGuid(), ProfileId = profile.Id, LinkTypeId = linkType.Id, Url = "https://linkedin.com/in/aj" };
        
        context.ResumeProfiles.Add(profile);
        context.ResumeProfileLinkTypes.Add(linkType);
        context.ResumeProfileLinks.Add(link);
        await context.SaveChangesAsync();

        // 3. Log a link click
        var clickReq = new LinkClickRequest
        {
            LinkId = link.Id,
            ReferrerSource = "linkedin_inbox",
            Country = "Canada",
            City = "Toronto"
        };
        var clickResponse = await _client.PostAsJsonAsync("/api/analytics/clicks", clickReq);
        await clickResponse.EnsureSuccessOrReportErrorAsync();

        // 4. Query the summary endpoint
        var summaryResponse = await _client.GetFromJsonOrReportErrorAsync<AnalyticsSummaryDto>("/api/analytics/summary");

        // Assert
        summaryResponse.ShouldNotBeNull();
        summaryResponse.TotalPageViews.ShouldBeGreaterThanOrEqualTo(1);
        summaryResponse.UniquePageViews.ShouldBeGreaterThanOrEqualTo(1);
        summaryResponse.TotalLinkClicks.ShouldBeGreaterThanOrEqualTo(1);
        summaryResponse.UniqueLinkClicks.ShouldBeGreaterThanOrEqualTo(1);
        
        var recentView = summaryResponse.RecentPageViews.FirstOrDefault(v => v.ReferrerSource == "github_readme");
        recentView.ShouldNotBeNull();
        recentView.Country.ShouldBe("Canada");

        var recentClick = summaryResponse.RecentLinkClicks.FirstOrDefault(c => c.LinkId == link.Id);
        recentClick.ShouldNotBeNull();
        recentClick.ReferrerSource.ShouldBe("linkedin_inbox");

        // Clean up
        using var cleanScope = _fixture.Factory.Services.CreateScope();
        var cleanContext = cleanScope.ServiceProvider.GetRequiredService<PortfolioDbContext>();

        var addedViews = await cleanContext.PageViewLogs.Where(v => v.ReferrerSource == "github_readme").ToListAsync();
        var addedClicks = await cleanContext.LinkClickLogs.Where(c => c.LinkId == link.Id).ToListAsync();
        
        cleanContext.PageViewLogs.RemoveRange(addedViews);
        cleanContext.LinkClickLogs.RemoveRange(addedClicks);
        cleanContext.ResumeProfileLinks.Remove(link);
        cleanContext.ResumeProfileLinkTypes.Remove(linkType);
        cleanContext.ResumeProfiles.Remove(profile);
        await cleanContext.SaveChangesAsync();
    }
}
