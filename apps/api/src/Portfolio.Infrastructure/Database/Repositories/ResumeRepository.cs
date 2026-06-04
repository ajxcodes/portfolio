using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Portfolio.Application.Resume.Repositories;
using Portfolio.Domain.Resume;
using Portfolio.Infrastructure.Database.Contexts;

namespace Portfolio.Infrastructure.Database.Repositories;

public class ResumeRepository(PortfolioDbContext context) : IResumeRepository
{
    public Task<ResumeProfile?> GetActiveProfileAsync()
    {
        return context.ResumeProfiles
            .Include(p => p.Links)
                .ThenInclude(l => l.LinkType)
            .Include(p => p.WorkExperiences.OrderBy(we => we.DisplayOrder))
                .ThenInclude(we => we.Highlights.OrderBy(eh => eh.DisplayOrder))
            .Include(p => p.WorkExperiences)
                .ThenInclude(we => we.WorkExperienceSkills)
                    .ThenInclude(wes => wes.Skill)
            .FirstOrDefaultAsync(p => p.IsActive);
    }

    public Task<List<ResumeProfile>> ListProfilesAsync()
    {
        return context.ResumeProfiles.ToListAsync();
    }

    public Task<ResumeProfile?> GetProfileByIdAsync(Guid id)
    {
        return context.ResumeProfiles
            .Include(p => p.Links)
            .Include(p => p.WorkExperiences)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task AddProfileAsync(ResumeProfile profile)
    {
        await context.ResumeProfiles.AddAsync(profile);
    }

    public Task UpdateProfileAsync(ResumeProfile profile)
    {
        context.ResumeProfiles.Update(profile);
        return Task.CompletedTask;
    }

    public async Task DeleteProfileAsync(Guid id)
    {
        var profile = await context.ResumeProfiles.FindAsync(id);
        if (profile != null)
        {
            context.ResumeProfiles.Remove(profile);
        }
    }

    public Task<List<SkillCategory>> ListSkillsAsync()
    {
        return context.SkillCategories
            .Include(c => c.Skills.OrderBy(s => s.DisplayOrder))
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();
    }

    public async Task AddSkillCategoryAsync(SkillCategory category)
    {
        await context.SkillCategories.AddAsync(category);
    }

    public async Task AddSkillAsync(Skill skill)
    {
        await context.Skills.AddAsync(skill);
    }

    public async Task DeleteSkillAsync(Guid id)
    {
        var skill = await context.Skills.FindAsync(id);
        if (skill != null)
        {
            context.Skills.Remove(skill);
        }
    }

    public async Task AddWorkExperienceAsync(WorkExperience experience)
    {
        await context.WorkExperiences.AddAsync(experience);
    }

    public async Task DeleteWorkExperienceAsync(Guid id)
    {
        var exp = await context.WorkExperiences.FindAsync(id);
        if (exp != null)
        {
            context.WorkExperiences.Remove(exp);
        }
    }

    public Task SaveChangesAsync()
    {
        return context.SaveChangesAsync();
    }
}
