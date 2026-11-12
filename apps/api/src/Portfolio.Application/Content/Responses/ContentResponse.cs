using Portfolio.Application.Releases;
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

    /// <summary>
    /// The mutable project start date. Only populated for projects; always <c>null</c> for
    /// blog posts.
    /// </summary>
    public DateTime? StartDate { get; set; }

    public List<string> Tags { get; set; } = new();
    public List<ProjectLinkResponse> ProjectLinks { get; set; } = new();
    public int Views { get; set; }

    /// <summary>
    /// The projects attached to this blog post. Empty for anything that is not a blog post.
    /// </summary>
    public List<RelatedProjectResponse> RelatedProjects { get; set; } = new();

    /// <summary>
    /// The releases published for this item. Only populated for projects; the release list of
    /// every entry in <see cref="RelatedProjects"/> starts empty and is filled in by the
    /// service layer.
    /// </summary>
    public List<RepoRelease> Releases { get; set; } = new();

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
            StartDate = (item as Project)?.StartDate,
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
                : new List<ProjectLinkResponse>(),
            RelatedProjects = item is BlogPost blogPost
                ? blogPost.PostProjects
                    .Where(pp => pp.Project is not null)
                    .Select(pp => new RelatedProjectResponse
                    {
                        Id = pp.Project!.Id,
                        Title = pp.Project.Title,
                        Slug = pp.Project.Slug,
                        Summary = pp.Project.Summary,
                        Visible = pp.Project.Visible,
                        ProjectLinks = pp.Project.ProjectLinks
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
                    })
                    .ToList()
                : new List<RelatedProjectResponse>()
        };
}
