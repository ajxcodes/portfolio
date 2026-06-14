using Portfolio.Domain.Resume;

namespace Portfolio.Domain.Analytics;

public class LinkClickLog
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid? LinkId { get; set; }
    public string? TargetUrl { get; set; }
    public string? LinkTypeName { get; set; }
    public DateTime ClickedAt { get; set; } = DateTime.UtcNow;
    public Guid? VisitorSessionId { get; set; }
    public virtual VisitorSession? VisitorSession { get; set; }
    
    public string? ReferrerSource { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }

    // Navigation property
    public virtual ResumeProfileLink? Link { get; set; }
}
