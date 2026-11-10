namespace Portfolio.Domain.Content;

public class ContentTagAssignment
{
    public Guid ContentItemId { get; set; }
    public Guid TagId { get; set; }

    // Navigation properties
    public virtual ContentItem? ContentItem { get; set; }
    public virtual ContentTag? ContentTag { get; set; }
}
