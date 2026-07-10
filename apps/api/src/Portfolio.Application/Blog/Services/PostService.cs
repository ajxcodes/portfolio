using Portfolio.Application.Analytics.Repositories;
using Portfolio.Application.Blog.Repositories;
using Portfolio.Application.Blog.Requests;
using Portfolio.Application.Blog.Responses;
using Portfolio.Domain.Blog;

namespace Portfolio.Application.Blog.Services;

public interface IPostService
{
    Task<IEnumerable<PostResponse>> ListAsync();
    Task<PostResponse?> GetAsync(Guid id);
    Task<PostResponse> CreateAsync(CreatePostRequest request, string authorUsername);
    Task<PostResponse?> UpdateAsync(Guid id, UpdatePostRequest request, string editorUsername);
    Task DeleteAsync(Guid id);
    Task<GenerateMetadataResponse> GenerateMetadataAsync(GenerateMetadataRequest request);
}

public class PostService(IPostRepository repository, AI.IAiChatService aiService, IAnalyticsRepository analyticsRepository) : IPostService
{
    public async Task<IEnumerable<PostResponse>> ListAsync()
    {
        var posts = await repository.ListAsync();
        var responses = posts.Select(PostResponse.FromDomain).ToList();
        
        var paths = responses.Select(r => $"/blog/{r.Slug}").ToList();
        var viewCounts = await analyticsRepository.GetPageViewsCountByPathAsync(paths);
        
        foreach (var r in responses)
        {
            r.Views = viewCounts.GetValueOrDefault($"/blog/{r.Slug}", 0);
        }
        
        return responses;
    }

    public async Task<PostResponse?> GetAsync(Guid id)
    {
        var post = await repository.GetAsync(id);
        if (post == null) return null;
        
        var response = PostResponse.FromDomain(post);
        var viewCounts = await analyticsRepository.GetPageViewsCountByPathAsync(new[] { $"/blog/{response.Slug}" });
        response.Views = viewCounts.GetValueOrDefault($"/blog/{response.Slug}", 0);
        
        return response;
    }

    public async Task<PostResponse> CreateAsync(CreatePostRequest request, string authorUsername)
    {
        var post = new Post
        {
            Id = Guid.NewGuid(),
            Slug = request.Slug,
            Title = request.Title,
            Summary = request.Summary,
            Content = request.Content,
            Visible = request.Visible,
            CanonicalUrl = request.CanonicalUrl,
            DatePosted = DateTime.UtcNow,
            PostedBy = authorUsername
        };

        if (request.Tags != null && request.Tags.Any())
        {
            foreach (var tagName in request.Tags.Select(t => t.Trim()).Where(t => !string.IsNullOrEmpty(t)))
            {
                var tag = await repository.GetTagByNameAsync(tagName);
                if (tag == null)
                {
                    tag = new Tag { Name = tagName };
                    await repository.AddTagAsync(tag);
                }
                post.PostTags.Add(new PostTag { PostId = post.Id, TagId = tag.Id, Post = post, Tag = tag });
            }
        }

        await repository.AddAsync(post);
        await repository.SaveChangesAsync();

        return PostResponse.FromDomain(post);
    }

    public async Task<PostResponse?> UpdateAsync(Guid id, UpdatePostRequest request, string editorUsername)
    {
        var post = await repository.GetAsync(id);
        if (post == null) return null;

        post.Slug = request.Slug;
        post.Title = request.Title;
        post.Summary = request.Summary;
        post.Content = request.Content;
        post.Visible = request.Visible;
        post.CanonicalUrl = request.CanonicalUrl;
        post.DateModified = DateTime.UtcNow;
        post.ModifiedBy = editorUsername;
        
        post.PostTags.Clear();
        if (request.Tags != null && request.Tags.Any())
        {
            foreach (var tagName in request.Tags.Select(t => t.Trim()).Where(t => !string.IsNullOrEmpty(t)))
            {
                var tag = await repository.GetTagByNameAsync(tagName);
                if (tag == null)
                {
                    tag = new Tag { Name = tagName };
                    await repository.AddTagAsync(tag);
                }
                post.PostTags.Add(new PostTag { PostId = post.Id, TagId = tag.Id, Post = post, Tag = tag });
            }
        }

        await repository.UpdateAsync(post);
        await repository.SaveChangesAsync();

        var response = PostResponse.FromDomain(post);
        var viewCounts = await analyticsRepository.GetPageViewsCountByPathAsync(new[] { $"/blog/{response.Slug}" });
        response.Views = viewCounts.GetValueOrDefault($"/blog/{response.Slug}", 0);
        return response;
    }

    public async Task DeleteAsync(Guid id)
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
}