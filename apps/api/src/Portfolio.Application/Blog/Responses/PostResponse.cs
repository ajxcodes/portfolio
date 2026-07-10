using Portfolio.Domain.Blog;

namespace Portfolio.Application.Blog.Responses;

public record PostResponse
{
    public required Guid Id { get; init; }
    public required string Slug { get; init; }
    public required string Title { get; init; }
    public string? Summary { get; init; }
    public required string Content { get; init; }
    public required DateTime DatePosted { get; init; }
    public required string PostedBy { get; init; } // author username
    public DateTime? DateModified { get; set; }
    public string? ModifiedBy { get; set; } // modified by username

    public bool Visible { get; init; }
    public string? CanonicalUrl { get; init; }

    public List<string> Tags { get; set; } = new();
    public int Views { get; set; }

    public static PostResponse FromDomain(Post post) =>
        new()
        {
            Id = post.Id,
            Slug = post.Slug,
            Title = post.Title,
            Summary = post.Summary,
            Content = post.Content,
            DatePosted = post.DatePosted,
            PostedBy = post.PostedBy,
            DateModified = post.DateModified,
            ModifiedBy = post.ModifiedBy,
            Visible = post.Visible,
            CanonicalUrl = post.CanonicalUrl,
            Tags = post.PostTags.Select(pt => pt.Tag!.Name).OrderBy(t => t).ToList()
        };
}