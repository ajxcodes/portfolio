using Portfolio.Domain.Blog;
using Portfolio.Domain.Content;

namespace Portfolio.Application.Content.Repositories;

public interface IContentRepository
{
    Task<List<ContentItem>> ListAsync(ContentType contentType);
    Task<ContentItem?> GetAsync(Guid id);
    Task<ContentItem?> GetBySlugAsync(string slug);
    Task AddAsync(ContentItem item);
    Task UpdateAsync(ContentItem item);
    Task DeleteAsync(Guid id);

    Task<List<ContentTag>> ListTagsAsync(ContentType contentType);
    Task<ContentTag?> GetTagByNameAsync(string name, ContentType contentType);
    Task AddTagAsync(ContentTag tag);

    Task AddPostSyndicationAsync(PostSyndication syndication);
    Task<List<PostSyndication>> GetPostSyndicationsAsync(Guid postId);

    Task SaveChangesAsync();
}
