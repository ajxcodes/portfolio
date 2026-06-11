using Portfolio.Domain.Analytics;

namespace Portfolio.Domain.Resume;

public class ResumeProfileLink
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid ProfileId { get; set; }
    public Guid LinkTypeId { get; set; }
    public string Url { get; set; } = string.Empty;
    public bool DisplayInHeader { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ResumeProfile? Profile { get; set; }
    public virtual ResumeProfileLinkType? LinkType { get; set; }
    public virtual ICollection<LinkClickLog> Clicks { get; set; } = new List<LinkClickLog>();
}
