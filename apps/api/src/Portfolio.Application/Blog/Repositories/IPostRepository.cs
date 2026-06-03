using Portfolio.Domain.Blog;

namespace Portfolio.Application.Blog.Repositories;

public interface IPostRepository
{
    Task<List<Post>> ListAsync();
    Task<Post> GetAsync(Guid id);
}