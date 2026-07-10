using Microsoft.EntityFrameworkCore;
using Portfolio.Application.Analytics.Repositories;
using Portfolio.Domain.Analytics;
using Portfolio.Infrastructure.Database.Contexts;

namespace Portfolio.Infrastructure.Database.Repositories;

public class AnalyticsRepository(PortfolioDbContext context) : IAnalyticsRepository
{
    public async Task LogPageViewAsync(PageViewLog log)
    {
        await context.PageViewLogs.AddAsync(log);
    }

    public async Task LogLinkClickAsync(LinkClickLog log)
    {
        await context.LinkClickLogs.AddAsync(log);
    }

    public async Task LogAiQueryAsync(AiQueryLog log)
    {
        await context.AiQueryLogs.AddAsync(log);
    }

    public Task<List<PageViewLog>> GetPageViewsAsync(int limit)
    {
        return context.PageViewLogs
            .OrderByDescending(pv => pv.ViewedAt)
            .Take(limit)
            .ToListAsync();
    }

    public Task<List<LinkClickLog>> GetLinkClicksAsync(int limit)
    {
        return context.LinkClickLogs
            .Include(c => c.Link)
                .ThenInclude(l => l!.LinkType)
            .OrderByDescending(c => c.ClickedAt)
            .Take(limit)
            .ToListAsync();
    }

    public Task<int> GetTotalPageViewsCountAsync()
    {
        return context.PageViewLogs.CountAsync();
    }

    public Task<int> GetUniquePageViewsCountAsync()
    {
        return context.PageViewLogs
            .Where(pv => pv.VisitorSessionId != null)
            .Select(pv => pv.VisitorSessionId)
            .Distinct()
            .CountAsync();
    }

    public Task<int> GetTotalLinkClicksCountAsync()
    {
        return context.LinkClickLogs.CountAsync();
    }

    public Task<int> GetUniqueLinkClicksCountAsync()
    {
        return context.LinkClickLogs
            .Where(c => c.VisitorSessionId != null)
            .Select(c => new { SessionId = c.VisitorSessionId, c.LinkId })
            .Distinct()
            .CountAsync();
    }

    public Task<int> GetTotalAiQueriesCountAsync()
    {
        return context.AiQueryLogs.CountAsync();
    }

    public Task<int> GetUniqueAiQueriesCountAsync()
    {
        return context.AiQueryLogs
            .Where(q => q.VisitorSessionId != null)
            .Select(q => q.VisitorSessionId)
            .Distinct()
            .CountAsync();
    }

    public Task<List<AiQueryLog>> GetAiQueriesAsync(int limit)
    {
        return context.AiQueryLogs
            .OrderByDescending(q => q.QueriedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<VisitorSession> GetOrCreateVisitorSessionAsync(string trackingId)
    {
        var session = await context.VisitorSessions.FirstOrDefaultAsync(s => s.TrackingId == trackingId);
        if (session == null)
        {
            session = new VisitorSession
            {
                Id = Guid.CreateVersion7(),
                TrackingId = trackingId,
                StartedAt = DateTime.UtcNow
            };
            await context.VisitorSessions.AddAsync(session);
        }
        return session;
    }

    public Task<Dictionary<string, int>> GetPageViewsCountByPathAsync(IEnumerable<string> paths)
    {
        return context.PageViewLogs
            .Where(pv => pv.PagePath != null && paths.Contains(pv.PagePath))
            .GroupBy(pv => pv.PagePath)
            .Select(g => new { Path = g.Key!, Count = g.Count() })
            .ToDictionaryAsync(k => k.Path, v => v.Count);
    }

    public Task SaveChangesAsync()
    {
        return context.SaveChangesAsync();
    }
}
