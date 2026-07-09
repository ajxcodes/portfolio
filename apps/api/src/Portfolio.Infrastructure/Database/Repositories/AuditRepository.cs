using Microsoft.EntityFrameworkCore;
using Portfolio.Application.Audit.Repositories;
using Portfolio.Domain.Audit;
using Portfolio.Infrastructure.Database.Contexts;

namespace Portfolio.Infrastructure.Database.Repositories;

public class AuditRepository(PortfolioDbContext context) : IAuditRepository
{
    public async Task LogAuditAsync(AuditLog log)
    {
        await context.AuditLogs.AddAsync(log);
    }

    public Task<List<AuditLog>> GetAuditLogsAsync(int limit)
    {
        return context.AuditLogs
            .OrderByDescending(al => al.Timestamp)
            .Take(limit)
            .ToListAsync();
    }

    public Task SaveChangesAsync()
    {
        return context.SaveChangesAsync();
    }
}
