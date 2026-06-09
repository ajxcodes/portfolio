namespace Portfolio.Domain.Blog;

public class Post
{
    public Guid Id { get; set; }
    public required string Slug { get; set; }
    public required string Title { get; set; }
    public string? Summary { get; set; }
    public required string Content { get; set; }
    public DateTime DatePosted { get; set; }
    public required string PostedBy { get; set; } // author username
    public DateTime? DateModified { get; set; }
    public string? ModifiedBy { get; set; } // modified by username
    public bool Visible { get; set; } = false;
    public string? CanonicalUrl { get; set; }

    // Navigation properties
    public virtual ICollection<PostTag> PostTags { get; set; } = new List<PostTag>();
    public virtual ICollection<PostSyndication> PostSyndications { get; set; } = new List<PostSyndication>();
}