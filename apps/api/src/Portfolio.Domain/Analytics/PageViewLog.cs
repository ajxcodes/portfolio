namespace Portfolio.Domain.Analytics;

public class PageViewLog
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string ReferrerSource { get; set; } = string.Empty;
    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
    public Guid? VisitorSessionId { get; set; }
    public virtual VisitorSession? VisitorSession { get; set; }
    
    public string? Country { get; set; }
    public string? City { get; set; }
}
