using Portfolio.Domain.Analytics;

namespace Portfolio.Application.Analytics.Repositories;

public interface IAnalyticsRepository
{
    Task LogPageViewAsync(PageViewLog log);
    Task LogLinkClickAsync(LinkClickLog log);
    Task LogAiQueryAsync(AiQueryLog log);
    Task<List<PageViewLog>> GetPageViewsAsync(int limit);
    Task<List<LinkClickLog>> GetLinkClicksAsync(int limit);
    Task<int> GetTotalPageViewsCountAsync();
    Task<int> GetUniquePageViewsCountAsync();
    Task<int> GetTotalLinkClicksCountAsync();
    Task<int> GetUniqueLinkClicksCountAsync();
    Task<int> GetTotalAiQueriesCountAsync();
    Task<int> GetUniqueAiQueriesCountAsync();
    Task<List<AiQueryLog>> GetAiQueriesAsync(int limit);
    Task<VisitorSession> GetOrCreateVisitorSessionAsync(string trackingId);
    Task SaveChangesAsync();
}
