using Portfolio.Application.Releases;

namespace Portfolio.Application.Content.Responses;

/// <summary>
/// A project attached to a blog post, as exposed on the blog read surface.
/// </summary>
public class RelatedProjectResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public bool Visible { get; set; }
    public List<ProjectLinkResponse> ProjectLinks { get; set; } = new();
    public List<RepoRelease> Releases { get; set; } = new();
}
