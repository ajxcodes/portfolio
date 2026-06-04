using System;
using Portfolio.Domain.Resume;

namespace Portfolio.Domain.Analytics;

public class LinkClickLog
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid LinkId { get; set; }
    public DateTime ClickedAt { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? ReferrerSource { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }

    // Navigation property
    public virtual ResumeProfileLink? Link { get; set; }
}
