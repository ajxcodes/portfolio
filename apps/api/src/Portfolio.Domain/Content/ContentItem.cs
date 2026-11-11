namespace Portfolio.Domain.Content;

public abstract class ContentItem
{
    public Guid Id { get; set; }
    public required string Slug { get; set; }
    public required string Title { get; set; }
    public string? Summary { get; set; }
    public required string Content { get; set; }
    public DateTime DatePosted { get; set; }
    public Guid ResumeProfileId { get; set; }
    public virtual Resume.ResumeProfile ResumeProfile { get; set; } = null!;
    public DateTime? DateModified { get; set; }
    public string? ModifiedBy { get; set; } // modified by username
    public bool Visible { get; set; } = false;
    public string? CanonicalUrl { get; set; }

    // Navigation properties
    public virtual ICollection<ContentTagAssignment> ContentTags { get; set; } = new List<ContentTagAssignment>();
}
