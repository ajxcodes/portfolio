using Portfolio.Domain.Blog;

namespace Portfolio.Domain.Content;

public class BlogPost : ContentItem
{
    // Navigation properties
    public virtual ICollection<PostSyndication> PostSyndications { get; set; } = new List<PostSyndication>();
}
