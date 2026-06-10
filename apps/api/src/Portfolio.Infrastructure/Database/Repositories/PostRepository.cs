using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Portfolio.Application.Blog.Repositories;
using Portfolio.Domain.Blog;
using Portfolio.Infrastructure.Database.Contexts;

namespace Portfolio.Infrastructure.Database.Repositories;

public class PostRepository(PortfolioDbContext context) : IPostRepository
{
    public Task<List<Post>> ListAsync()
    {
        return context.Posts
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.PostTags)
                .ThenInclude(pt => pt.Tag)
            .Include(p => p.PostSyndications)
                .ThenInclude(ps => ps.Platform)
            .OrderByDescending(p => p.DatePosted)
            .ToListAsync();
    }

    public Task<Post?> GetAsync(Guid id)
    {
        return context.Posts
            .AsSplitQuery()
            .Include(p => p.PostTags)
                .ThenInclude(pt => pt.Tag)
            .Include(p => p.PostSyndications)
                .ThenInclude(ps => ps.Platform)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public Task<Post?> GetBySlugAsync(string slug)
    {
        return context.Posts
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.PostTags)
                .ThenInclude(pt => pt.Tag)
            .Include(p => p.PostSyndications)
                .ThenInclude(ps => ps.Platform)
            .FirstOrDefaultAsync(p => p.Slug == slug);
    }

    public async Task AddAsync(Post post)
    {
        await context.Posts.AddAsync(post);
    }

    public Task UpdateAsync(Post post)
    {
        context.Posts.Update(post);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id)
    {
        var post = await context.Posts.FindAsync(id);
        if (post != null)
        {
            context.Posts.Remove(post);
        }
    }

    public Task<List<Tag>> ListTagsAsync()
    {
        return context.Tags.OrderBy(t => t.Name).ToListAsync();
    }

    public Task<Tag?> GetTagByNameAsync(string name)
    {
        return context.Tags.FirstOrDefaultAsync(t => t.Name == name);
    }

    public async Task AddTagAsync(Tag tag)
    {
        await context.Tags.AddAsync(tag);
    }

    public async Task AddPostSyndicationAsync(PostSyndication syndication)
    {
        await context.PostSyndications.AddAsync(syndication);
    }

    public Task<List<PostSyndication>> GetPostSyndicationsAsync(Guid postId)
    {
        return context.PostSyndications
            .Include(ps => ps.Platform)
            .Where(ps => ps.PostId == postId)
            .ToListAsync();
    }

    public Task SaveChangesAsync()
    {
        return context.SaveChangesAsync();
    }
}