using Portfolio.Domain.Blog;

namespace Portfolio.Application.Blog.Repositories;

public interface IPostRepository
{
    Task<List<Post>> ListAsync();
    Task<Post?> GetAsync(Guid id);
    Task<Post?> GetBySlugAsync(string slug);
    Task AddAsync(Post post);
    Task UpdateAsync(Post post);
    Task DeleteAsync(Guid id);
    
    Task<List<Tag>> ListTagsAsync();
    Task<Tag?> GetTagByNameAsync(string name);
    Task AddTagAsync(Tag tag);
    
    Task AddPostSyndicationAsync(PostSyndication syndication);
    Task<List<PostSyndication>> GetPostSyndicationsAsync(Guid postId);
    
    Task SaveChangesAsync();
}