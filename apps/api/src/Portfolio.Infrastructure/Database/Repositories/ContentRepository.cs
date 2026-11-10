using Microsoft.EntityFrameworkCore;
using Portfolio.Application.Content.Repositories;
using Portfolio.Domain.Blog;
using Portfolio.Domain.Content;
using Portfolio.Infrastructure.Database.Contexts;

namespace Portfolio.Infrastructure.Database.Repositories;

public class ContentRepository(PortfolioDbContext context) : IContentRepository
{
    public async Task<List<ContentItem>> ListAsync(ContentType contentType)
    {
        if (contentType == ContentType.Project)
        {
            var projects = await context.ContentItems
                .OfType<Project>()
                .AsNoTracking()
                .AsSplitQuery()
                .Include(p => p.ResumeProfile)
                .Include(p => p.ContentTags)
                    .ThenInclude(ct => ct.ContentTag)
                .Include(p => p.ProjectLinks)
                .OrderByDescending(p => p.DatePosted)
                .ToListAsync();

            return projects.Cast<ContentItem>().ToList();
        }

        var posts = await context.ContentItems
            .OfType<BlogPost>()
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.ResumeProfile)
            .Include(p => p.ContentTags)
                .ThenInclude(ct => ct.ContentTag)
            .Include(p => p.PostSyndications)
                .ThenInclude(ps => ps.Platform)
            .OrderByDescending(p => p.DatePosted)
            .ToListAsync();

        return posts.Cast<ContentItem>().ToList();
    }

    public async Task<ContentItem?> GetAsync(Guid id)
    {
        var project = await context.ContentItems
            .OfType<Project>()
            .AsSplitQuery()
            .Include(p => p.ResumeProfile)
            .Include(p => p.ContentTags)
                .ThenInclude(ct => ct.ContentTag)
            .Include(p => p.ProjectLinks)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project != null) return project;

        var post = await context.ContentItems
            .OfType<BlogPost>()
            .AsSplitQuery()
            .Include(p => p.ResumeProfile)
            .Include(p => p.ContentTags)
                .ThenInclude(ct => ct.ContentTag)
            .Include(p => p.PostSyndications)
                .ThenInclude(ps => ps.Platform)
            .FirstOrDefaultAsync(p => p.Id == id);

        return post;
    }

    public async Task<ContentItem?> GetBySlugAsync(string slug)
    {
        var project = await context.ContentItems
            .OfType<Project>()
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.ResumeProfile)
            .Include(p => p.ContentTags)
                .ThenInclude(ct => ct.ContentTag)
            .Include(p => p.ProjectLinks)
            .FirstOrDefaultAsync(p => p.Slug == slug);

        if (project != null) return project;

        var post = await context.ContentItems
            .OfType<BlogPost>()
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.ResumeProfile)
            .Include(p => p.ContentTags)
                .ThenInclude(ct => ct.ContentTag)
            .Include(p => p.PostSyndications)
                .ThenInclude(ps => ps.Platform)
            .FirstOrDefaultAsync(p => p.Slug == slug);

        return post;
    }

    public async Task AddAsync(ContentItem item)
    {
        await context.ContentItems.AddAsync(item);
    }

    public Task UpdateAsync(ContentItem item)
    {
        context.ContentItems.Update(item);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id)
    {
        var item = await context.ContentItems.FindAsync(id);
        if (item != null)
        {
            context.ContentItems.Remove(item);
        }
    }

    public Task<List<ContentTag>> ListTagsAsync(ContentType contentType)
    {
        return context.ContentTags
            .Where(t => t.ContentType == contentType)
            .OrderBy(t => t.Name)
            .ToListAsync();
    }

    public Task<ContentTag?> GetTagByNameAsync(string name, ContentType contentType)
    {
        return context.ContentTags
            .FirstOrDefaultAsync(t => t.Name == name && t.ContentType == contentType);
    }

    public async Task AddTagAsync(ContentTag tag)
    {
        await context.ContentTags.AddAsync(tag);
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
