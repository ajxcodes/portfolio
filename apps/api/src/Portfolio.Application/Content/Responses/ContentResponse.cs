using Portfolio.Domain.Content;

namespace Portfolio.Application.Content.Responses;

public record ContentResponse
{
    public required Guid Id { get; init; }
    public required string Slug { get; init; }
    public required string Title { get; init; }
    public string? Summary { get; init; }
    public required string Content { get; init; }
    public required DateTime DatePosted { get; init; }
    public required Guid ResumeProfileId { get; init; }
    public required string AuthorName { get; init; }
    public DateTime? DateModified { get; set; }
    public string? ModifiedBy { get; set; } // modified by username

    public bool Visible { get; init; }
    public string? CanonicalUrl { get; init; }

    public List<string> Tags { get; set; } = new();
    public List<ProjectLinkResponse> ProjectLinks { get; set; } = new();
    public int Views { get; set; }

    public static ContentResponse FromDomain(ContentItem item) =>
        new()
        {
            Id = item.Id,
            Slug = item.Slug,
            Title = item.Title,
            Summary = item.Summary,
            Content = item.Content,
            DatePosted = item.DatePosted,
            ResumeProfileId = item.ResumeProfileId,
            AuthorName = item.ResumeProfile?.Name ?? string.Empty,
            DateModified = item.DateModified,
            ModifiedBy = item.ModifiedBy,
            Visible = item.Visible,
            CanonicalUrl = item.CanonicalUrl,
            Tags = item.ContentTags.Select(ct => ct.ContentTag!.Name).OrderBy(t => t).ToList(),
            ProjectLinks = item is Project project
                ? project.ProjectLinks
                    .OrderBy(l => l.DisplayOrder)
                    .Select(l => new ProjectLinkResponse
                    {
                        Id = l.Id,
                        Type = l.Type,
                        Url = l.Url,
                        Label = l.Label,
                        DisplayOrder = l.DisplayOrder
                    })
                    .ToList()
                : new List<ProjectLinkResponse>()
        };
}
