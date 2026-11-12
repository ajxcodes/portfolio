using Portfolio.Domain.Blog;

namespace Portfolio.Domain.Content;

public class BlogPost : ContentItem
{
    // Navigation properties
    public virtual ICollection<PostSyndication> PostSyndications { get; set; } = new List<PostSyndication>();

    /// <summary>
    /// The projects attached to this post (principal side of the join table).
    /// </summary>
    public virtual ICollection<PostProject> PostProjects { get; set; } = new List<PostProject>();
}
