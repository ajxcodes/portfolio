using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Portfolio.Domain.Analytics;

namespace Portfolio.Application.Analytics.Repositories;

public interface IAnalyticsRepository
{
    Task LogPageViewAsync(PageViewLog log);
    Task LogLinkClickAsync(LinkClickLog log);
    Task<List<PageViewLog>> GetPageViewsAsync(int limit);
    Task<List<LinkClickLog>> GetLinkClicksAsync(int limit);
    Task<int> GetTotalPageViewsCountAsync();
    Task<int> GetUniquePageViewsCountAsync();
    Task<int> GetTotalLinkClicksCountAsync();
    Task<int> GetUniqueLinkClicksCountAsync();
    Task SaveChangesAsync();
}
