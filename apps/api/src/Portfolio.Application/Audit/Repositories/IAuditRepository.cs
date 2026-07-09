using Portfolio.Domain.Audit;

namespace Portfolio.Application.Audit.Repositories;

public interface IAuditRepository
{
    Task LogAuditAsync(AuditLog log);
    Task<List<AuditLog>> GetAuditLogsAsync(int limit);
    Task SaveChangesAsync();
}
