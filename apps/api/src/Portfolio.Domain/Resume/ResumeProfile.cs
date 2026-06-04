using System;
using System.Collections.Generic;

namespace Portfolio.Domain.Resume;

public class ResumeProfile
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Name { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Intro { get; set; } = string.Empty;
    public string PhotoUrlLight { get; set; } = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";
    public string PhotoUrlDark { get; set; } = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80";
    public bool IsActive { get; set; } = false;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<ResumeProfileLink> Links { get; set; } = new List<ResumeProfileLink>();
    public virtual ICollection<WorkExperience> WorkExperiences { get; set; } = new List<WorkExperience>();
}
