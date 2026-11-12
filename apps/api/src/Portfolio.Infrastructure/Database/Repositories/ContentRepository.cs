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
            .Include(p => p.PostProjects)
                .ThenInclude(pp => pp.Project)
                    .ThenInclude(pr => pr!.ProjectLinks)
            .OrderByDescending(p => p.DatePosted)
            .ToListAsync();

        return posts.Cast<ContentItem>().ToList();
    }

    public async Task<ContentItem?> GetAsync(Guid id, ContentType contentType)
    {
        if (contentType == ContentType.Project)
        {
            return await context.ContentItems
                .OfType<Project>()
                .AsSplitQuery()
                .Include(p => p.ResumeProfile)
                .Include(p => p.ContentTags)
                    .ThenInclude(ct => ct.ContentTag)
                .Include(p => p.ProjectLinks)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        return await context.ContentItems
            .OfType<BlogPost>()
            .AsSplitQuery()
            .Include(p => p.ResumeProfile)
            .Include(p => p.ContentTags)
                .ThenInclude(ct => ct.ContentTag)
            .Include(p => p.PostSyndications)
                .ThenInclude(ps => ps.Platform)
            .Include(p => p.PostProjects)
                .ThenInclude(pp => pp.Project)
                    .ThenInclude(pr => pr!.ProjectLinks)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<ContentItem?> GetBySlugAsync(string slug, ContentType contentType)
    {
        if (contentType == ContentType.Project)
        {
            return await context.ContentItems
                .OfType<Project>()
                .AsNoTracking()
                .AsSplitQuery()
                .Include(p => p.ResumeProfile)
                .Include(p => p.ContentTags)
                    .ThenInclude(ct => ct.ContentTag)
                .Include(p => p.ProjectLinks)
                .FirstOrDefaultAsync(p => p.Slug == slug);
        }

        return await context.ContentItems
            .OfType<BlogPost>()
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.ResumeProfile)
            .Include(p => p.ContentTags)
                .ThenInclude(ct => ct.ContentTag)
            .Include(p => p.PostSyndications)
                .ThenInclude(ps => ps.Platform)
            .Include(p => p.PostProjects)
                .ThenInclude(pp => pp.Project)
                    .ThenInclude(pr => pr!.ProjectLinks)
            .FirstOrDefaultAsync(p => p.Slug == slug);
    }

    public async Task AddAsync(ContentItem item)
    {
        await context.ContentItems.AddAsync(item);
    }

    public Task UpdateAsync(ContentItem item)
    {
        if (item is Project project)
        {
            // The caller replaces the link collection wholesale: the previous rows are
            // orphaned (cascade delete) and the replacement rows are new, so they must be
            // INSERTed. A blanket graph Update() marks them Modified and emits a no-op
            // UPDATE that matches zero rows.
            // Links that are already tracked (e.g. the start-date path, which does not touch
            // the links at all) must be left alone - forcing them to Added would emit a
            // duplicate-key INSERT.
            foreach (var link in project.ProjectLinks)
            {
                if (context.Entry(link).State == EntityState.Detached)
                {
                    context.Entry(link).State = EntityState.Added;
                }
            }
        }

        context.Entry(item).State = EntityState.Modified;
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

    public Task<PostProject?> GetPostProjectAsync(Guid postId, Guid projectId)
    {
        return context.PostProjects
            .Include(pp => pp.Project)
                .ThenInclude(pr => pr!.ProjectLinks)
            .FirstOrDefaultAsync(pp => pp.PostId == postId && pp.ProjectId == projectId);
    }

    public async Task AddPostProjectAsync(PostProject postProject)
    {
        await context.PostProjects.AddAsync(postProject);
    }

    public Task RemovePostProjectAsync(PostProject postProject)
    {
        context.PostProjects.Remove(postProject);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync()
    {
        return context.SaveChangesAsync();
    }
}
