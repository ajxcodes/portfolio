namespace Portfolio.Domain.Blog;

public class SyndicationPlatform
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Name { get; set; } = string.Empty;
    public string KeyIdentifier { get; set; } = string.Empty;
    public string? ApiKey { get; set; }
    public string? PublisherId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<PostSyndication> PostSyndications { get; set; } = new List<PostSyndication>();
}
