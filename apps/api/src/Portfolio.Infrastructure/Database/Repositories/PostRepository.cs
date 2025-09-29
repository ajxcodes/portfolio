using Microsoft.EntityFrameworkCore;
using Portfolio.Application.Blog.Repositories;
using Portfolio.Domain.Blog;
using Portfolio.Infrastructure.Database.Contexts;

namespace Portfolio.Infrastructure.Database.Repositories;

public class PostRepository(PortfolioDbContext context) : IPostRepository
{
    public Task<List<Post>> ListAsync() => context.Set<Post>().ToListAsync();
}