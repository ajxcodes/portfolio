using Portfolio.Application.Analytics.Repositories;
using Portfolio.Application.Resume.Repositories;
using Portfolio.Domain.Analytics;

using Microsoft.Extensions.Logging;

namespace Portfolio.Application.Analytics.Services;

public interface IAnalyticsService
{
    Task LogPageViewAsync(PageViewLog log);
    Task LogLinkClickAsync(LinkClickLog log);
    Task<AnalyticsSummaryDto> GetSummaryAsync(int limit);
}

public class AnalyticsService(
    IAnalyticsRepository repository,
    IResumeRepository resumeRepository,
    ILogger<AnalyticsService> logger) : IAnalyticsService
{
    public async Task LogPageViewAsync(PageViewLog log)
    {
        await repository.LogPageViewAsync(log);
        await repository.SaveChangesAsync();
    }

    public async Task LogLinkClickAsync(LinkClickLog log)
    {
        // Safety guard: silently discard clicks for link IDs that don't exist in the DB.
        // The frontend is responsible for sending the correct DB GUID via data-link-id.
        if (log.LinkId.HasValue)
        {
            var link = await resumeRepository.GetLinkByIdAsync(log.LinkId.Value);
            if (link == null)
            {
                logger.LogWarning("Link click received for missing LinkId {LinkId}. This may indicate a desync between the frontend and backend.", log.LinkId);
                return;
            }
            
            log.TargetUrl = System.Text.RegularExpressions.Regex.Replace(link.Url ?? "", @"[\r\n\t]", "");
            log.LinkTypeName = System.Text.RegularExpressions.Regex.Replace(link.LinkType?.Name ?? "", @"[\r\n\t]", "");
        }

        await repository.LogLinkClickAsync(log);
        await repository.SaveChangesAsync();
    }

    public async Task<AnalyticsSummaryDto> GetSummaryAsync(int limit)
    {
        var totalPageViews = await repository.GetTotalPageViewsCountAsync();
        var uniquePageViews = await repository.GetUniquePageViewsCountAsync();
        var totalLinkClicks = await repository.GetTotalLinkClicksCountAsync();
        var uniqueLinkClicks = await repository.GetUniqueLinkClicksCountAsync();

        var recentPageViews = await repository.GetPageViewsAsync(limit);
        var recentLinkClicks = await repository.GetLinkClicksAsync(limit);

        return new AnalyticsSummaryDto
        {
            TotalPageViews = totalPageViews,
            UniquePageViews = uniquePageViews,
            TotalLinkClicks = totalLinkClicks,
            UniqueLinkClicks = uniqueLinkClicks,
            RecentPageViews = recentPageViews,
            RecentLinkClicks = recentLinkClicks
        };
    }
}

public class AnalyticsSummaryDto
{
    public int TotalPageViews { get; set; }
    public int UniquePageViews { get; set; }
    public int TotalLinkClicks { get; set; }
    public int UniqueLinkClicks { get; set; }
    public List<PageViewLog> RecentPageViews { get; set; } = new();
    public List<LinkClickLog> RecentLinkClicks { get; set; } = new();
}
