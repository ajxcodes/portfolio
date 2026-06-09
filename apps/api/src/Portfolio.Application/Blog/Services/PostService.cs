using Portfolio.Application.Blog.Repositories;
using Portfolio.Application.Blog.Responses;

namespace Portfolio.Application.Blog.Services;

public interface IPostService
{
    Task<IEnumerable<PostResponse>> ListAsync();
    Task<PostResponse> GetAsync(Guid id);
}

public class PostService(IPostRepository repository) : IPostService
{
    public async Task<IEnumerable<PostResponse>> ListAsync()
    {
        var posts = await repository.ListAsync();
        return posts.Select(PostResponse.FromDomain);
    }

    public async Task<PostResponse> GetAsync(Guid id)
    {
        var post = await repository.GetAsync(id);
        return post == null
            ? throw new InvalidOperationException($"Post with id {id} not found")
            : PostResponse.FromDomain(post);
    }
}