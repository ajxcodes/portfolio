namespace Portfolio.Domain.Blog;

public class Post
{
    public Guid Id { get; set; }
    public string Slug { get; set; }
    public string Title { get; set; }
    public string? Summary { get; set; }
    public string Content { get; set; }
    public DateTime DatePosted { get; set; }
    public string PostedBy { get; set; } // author username
    public DateTime? DateModified { get; set; }
    public string? ModifiedBy { get; set; } // modified by username
}