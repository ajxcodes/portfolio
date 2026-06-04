using System;

namespace Portfolio.Domain.Audit;

public class AuditLog
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Action { get; set; } = string.Empty;
    public string Actor { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? Changes { get; set; } // JSON serialized modifications
}
