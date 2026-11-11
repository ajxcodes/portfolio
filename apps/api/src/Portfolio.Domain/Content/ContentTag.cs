namespace Portfolio.Domain.Content;

public class ContentTag
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Name { get; set; } = string.Empty;
    public ContentType ContentType { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<ContentTagAssignment> ContentTagAssignments { get; set; } = new List<ContentTagAssignment>();
}
