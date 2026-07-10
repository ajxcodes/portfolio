namespace Portfolio.Application.Blog.Requests;

public class GenerateMetadataRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Summary { get; set; }
}
