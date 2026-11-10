using Portfolio.Application.Blog.Requests;
using Portfolio.Application.Blog.Responses;
using Portfolio.Application.Content.Requests;
using Portfolio.Application.Content.Responses;
using Portfolio.Domain.Content;

namespace Portfolio.Application.Content.Services;

public interface IContentService
{
    Task<IEnumerable<ContentResponse>> ListAsync(ContentType contentType);
    Task<ContentResponse?> GetAsync(Guid id, ContentType contentType);
    Task<ContentResponse> CreateAsync(ContentType contentType, CreateContentRequest request);
    Task<ContentResponse?> UpdateAsync(Guid id, ContentType contentType, UpdateContentRequest request, string editorUsername);
    Task DeleteAsync(Guid id, ContentType contentType);
    Task<GenerateMetadataResponse> GenerateMetadataAsync(GenerateMetadataRequest request);
}

public class ContentService(
    Content.Repositories.IContentRepository repository,
    Resume.Repositories.IResumeRepository resumeRepository,
    Analytics.Repositories.IAnalyticsRepository analyticsRepository,
    AI.IAiChatService aiService) : IContentService
{
    public async Task<IEnumerable<ContentResponse>> ListAsync(ContentType contentType)
    {
        var items = await repository.ListAsync(contentType);
        var responses = items.Select(ContentResponse.FromDomain).ToList();

        if (contentType == ContentType.Blog)
        {
            var paths = responses.Select(r => $"/blog/{r.Slug}").ToList();
            var viewCounts = await analyticsRepository.GetPageViewsCountByPathAsync(paths);

            foreach (var r in responses)
            {
                r.Views = viewCounts.GetValueOrDefault($"/blog/{r.Slug}", 0);
            }
        }

        return responses;
    }

    public async Task<ContentResponse?> GetAsync(Guid id, ContentType contentType)
    {
        var item = await repository.GetAsync(id);
        if (item == null || !IsOfType(item, contentType)) return null;

        var response = ContentResponse.FromDomain(item);

        if (contentType == ContentType.Blog)
        {
            var viewCounts = await analyticsRepository.GetPageViewsCountByPathAsync(new[] { $"/blog/{response.Slug}" });
            response.Views = viewCounts.GetValueOrDefault($"/blog/{response.Slug}", 0);
        }

        return response;
    }

    public async Task<ContentResponse> CreateAsync(ContentType contentType, CreateContentRequest request)
    {
        var profile = await resumeRepository.GetProfileByIdAsync(request.ResumeProfileId);
        if (profile == null)
        {
            throw new ArgumentException($"ResumeProfile with ID {request.ResumeProfileId} not found.", nameof(request.ResumeProfileId));
        }

        var item = CreateItem(contentType);

        item.Id = Guid.NewGuid();
        item.Slug = request.Slug;
        item.Title = request.Title;
        item.Summary = request.Summary;
        item.Content = request.Content;
        item.Visible = request.Visible;
        item.CanonicalUrl = request.CanonicalUrl;
        item.DatePosted = DateTime.UtcNow;
        item.ResumeProfileId = request.ResumeProfileId;

        await ApplyTagsAsync(item, request.Tags, contentType);

        if (item is Project project)
        {
            ApplyProjectLinks(project, request.ProjectLinks);
        }

        await repository.AddAsync(item);
        await repository.SaveChangesAsync();

        return ContentResponse.FromDomain(item);
    }

    public async Task<ContentResponse?> UpdateAsync(Guid id, ContentType contentType, UpdateContentRequest request, string editorUsername)
    {
        var item = await repository.GetAsync(id);
        if (item == null || !IsOfType(item, contentType)) return null;

        if (item.ResumeProfileId != request.ResumeProfileId)
        {
            var profile = await resumeRepository.GetProfileByIdAsync(request.ResumeProfileId);
            if (profile == null)
            {
                throw new ArgumentException($"ResumeProfile with ID {request.ResumeProfileId} not found.", nameof(request.ResumeProfileId));
            }
        }

        item.Slug = request.Slug;
        item.Title = request.Title;
        item.ResumeProfileId = request.ResumeProfileId;
        item.Summary = request.Summary;
        item.Content = request.Content;
        item.Visible = request.Visible;
        item.CanonicalUrl = request.CanonicalUrl;
        item.DateModified = DateTime.UtcNow;
        item.ModifiedBy = editorUsername;

        item.ContentTags.Clear();
        await ApplyTagsAsync(item, request.Tags, contentType);

        if (item is Project project)
        {
            project.ProjectLinks.Clear();
            ApplyProjectLinks(project, request.ProjectLinks);
        }

        await repository.UpdateAsync(item);
        await repository.SaveChangesAsync();

        var response = ContentResponse.FromDomain(item);
        if (contentType == ContentType.Blog)
        {
            var viewCounts = await analyticsRepository.GetPageViewsCountByPathAsync(new[] { $"/blog/{response.Slug}" });
            response.Views = viewCounts.GetValueOrDefault($"/blog/{response.Slug}", 0);
        }
        return response;
    }

    public async Task DeleteAsync(Guid id, ContentType contentType)
    {
        await repository.DeleteAsync(id);
        await repository.SaveChangesAsync();
    }

    public async Task<GenerateMetadataResponse> GenerateMetadataAsync(GenerateMetadataRequest request)
    {
        var response = new GenerateMetadataResponse();

        if (string.IsNullOrWhiteSpace(request.Summary) && !string.IsNullOrWhiteSpace(request.Content))
        {
            var prompt = $"Generate a concise, 1-2 sentence summary for a blog post titled '{request.Title}'. Output ONLY the summary text.";
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
            var summary = await aiService.AskQuestionAsync("You are a helpful blog editor. Return only the requested text without quotes or markdown formatting.", prompt + "\n\nContent:\n" + request.Content, cts.Token);
            response.Summary = summary.Trim();
        }

        if (string.IsNullOrWhiteSpace(request.Slug) && !string.IsNullOrWhiteSpace(request.Title))
        {
            var contentSummary = response.Summary ?? request.Summary ?? "No summary";
            var prompt = $"Generate a clean, URL-friendly slug (lowercase, hyphen-separated, no special characters) for a blog post titled '{request.Title}'. The post is about: '{contentSummary}'. Output ONLY the slug.";
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
            var slug = await aiService.AskQuestionAsync("You are a strict URL slug generator. Return only the slug string.", prompt, cts.Token);

            slug = slug.ToLowerInvariant().Trim();
            slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\-]", "-");
            slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-+", "-").Trim('-');

            response.Slug = slug;
        }

        return response;
    }

    private static ContentItem CreateItem(ContentType contentType) => contentType switch
    {
        ContentType.Blog => new BlogPost { Slug = string.Empty, Title = string.Empty, Content = string.Empty },
        ContentType.Project => new Project { Slug = string.Empty, Title = string.Empty, Content = string.Empty },
        _ => throw new ArgumentOutOfRangeException(nameof(contentType), contentType, "Unsupported content type.")
    };

    private static bool IsOfType(ContentItem item, ContentType contentType) => contentType switch
    {
        ContentType.Blog => item is BlogPost,
        ContentType.Project => item is Project,
        _ => false
    };

    private async Task ApplyTagsAsync(ContentItem item, List<string>? tags, ContentType contentType)
    {
        if (tags == null || !tags.Any()) return;

        foreach (var tagName in tags.Select(t => t.Trim()).Where(t => !string.IsNullOrEmpty(t)))
        {
            var tag = await repository.GetTagByNameAsync(tagName, contentType);
            if (tag == null)
            {
                tag = new ContentTag { Name = tagName, ContentType = contentType };
                await repository.AddTagAsync(tag);
            }
            item.ContentTags.Add(new ContentTagAssignment { ContentItemId = item.Id, TagId = tag.Id, ContentItem = item, ContentTag = tag });
        }
    }

    private static void ApplyProjectLinks(Project project, List<ProjectLinkRequest>? links)
    {
        if (links == null || !links.Any()) return;

        var order = 0;
        foreach (var link in links)
        {
            project.ProjectLinks.Add(new ProjectLink
            {
                ProjectId = project.Id,
                Type = link.Type,
                Url = link.Url,
                Label = link.Label,
                DisplayOrder = order++,
                Project = project
            });
        }
    }
}
