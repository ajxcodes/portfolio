namespace Portfolio.Domain.Resume;

public class ResumeProfileLinkType
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Name { get; set; } = string.Empty;
    public string KeyIdentifier { get; set; } = string.Empty;

    // Navigation properties
    public virtual ICollection<ResumeProfileLink> Links { get; set; } = new List<ResumeProfileLink>();
}
