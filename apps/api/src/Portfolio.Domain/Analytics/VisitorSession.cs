using System;
using System.Collections.Generic;

namespace Portfolio.Domain.Analytics;

public class VisitorSession
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    
    /// <summary>
    /// A persistent identifier derived from a cookie or hashed IP/UserAgent.
    /// Used to group the visitor's journey together.
    /// </summary>
    public string TrackingId { get; set; } = string.Empty;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    
    // Geographic data stored at the session level to avoid duplicating per event
    public string? Country { get; set; }
    public string? City { get; set; }

    // Navigation properties for the unified journey
    public virtual ICollection<PageViewLog> PageViews { get; set; } = new List<PageViewLog>();
    public virtual ICollection<LinkClickLog> LinkClicks { get; set; } = new List<LinkClickLog>();
    public virtual ICollection<AiQueryLog> AiQueries { get; set; } = new List<AiQueryLog>();
}
