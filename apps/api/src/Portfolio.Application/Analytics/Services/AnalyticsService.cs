using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Portfolio.Application.Analytics.Repositories;
using Portfolio.Domain.Analytics;

namespace Portfolio.Application.Analytics.Services;

public interface IAnalyticsService
{
    Task LogPageViewAsync(PageViewLog log);
    Task LogLinkClickAsync(LinkClickLog log);
    Task<AnalyticsSummaryDto> GetSummaryAsync(int limit);
}

public class AnalyticsService(IAnalyticsRepository repository) : IAnalyticsService
{
    public async Task LogPageViewAsync(PageViewLog log)
    {
        await repository.LogPageViewAsync(log);
        await repository.SaveChangesAsync();
    }

    public async Task LogLinkClickAsync(LinkClickLog log)
    {
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
