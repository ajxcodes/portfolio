namespace Portfolio.Domain.Blog;

public class PostSyndication
{
    public Guid PostId { get; set; }
    public Guid PlatformId { get; set; }
    public string ExternalUrl { get; set; } = string.Empty;
    public string? ExternalId { get; set; }
    public DateTime SyndicatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Post? Post { get; set; }
    public virtual SyndicationPlatform? Platform { get; set; }
}
