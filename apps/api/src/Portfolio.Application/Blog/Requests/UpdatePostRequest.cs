namespace Portfolio.Application.Blog.Requests;

public class UpdatePostRequest
{
    public required string Slug { get; set; }
    public required string Title { get; set; }
    public string? Summary { get; set; }
    public required string Content { get; set; }
    public bool Visible { get; set; }
    public string? CanonicalUrl { get; set; }
    public List<string> Tags { get; set; } = new();
}
