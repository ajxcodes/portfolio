using Portfolio.Domain.Blog;

namespace Portfolio.Application.Blog.Responses;

public record PostResponse
{
    public required Guid Id { get; init; }
    public required string Slug { get; init; }
    public required string Title { get; init; }
    public string? Summary { get; init; }
    public string Content { get; init; }
    public required DateTime DatePosted { get; init; }
    public string PostedBy { get; init; } // author username
    public DateTime? DateModified { get; set; }
    public string? ModifiedBy { get; set; } // modified by username

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
            ModifiedBy = post.ModifiedBy
        };
}