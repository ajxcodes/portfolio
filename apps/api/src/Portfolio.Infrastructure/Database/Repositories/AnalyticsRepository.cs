using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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

    public Task SaveChangesAsync()
    {
        return context.SaveChangesAsync();
    }
}
