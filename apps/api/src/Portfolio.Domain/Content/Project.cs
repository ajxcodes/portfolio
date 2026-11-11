namespace Portfolio.Domain.Content;

public class Project : ContentItem
{
    // Navigation properties
    public virtual ICollection<ProjectLink> ProjectLinks { get; set; } = new List<ProjectLink>();
}
