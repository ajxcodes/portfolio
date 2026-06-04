using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Portfolio.Domain.Resume;

namespace Portfolio.Application.Resume.Repositories;

public interface IResumeRepository
{
    Task<ResumeProfile?> GetActiveProfileAsync();
    Task<List<ResumeProfile>> ListProfilesAsync();
    Task<ResumeProfile?> GetProfileByIdAsync(Guid id);
    Task AddProfileAsync(ResumeProfile profile);
    Task UpdateProfileAsync(ResumeProfile profile);
    Task DeleteProfileAsync(Guid id);
    
    Task<List<SkillCategory>> ListSkillsAsync();
    Task AddSkillCategoryAsync(SkillCategory category);
    Task AddSkillAsync(Skill skill);
    Task DeleteSkillAsync(Guid id);

    Task AddWorkExperienceAsync(WorkExperience experience);
    Task DeleteWorkExperienceAsync(Guid id);

    Task SaveChangesAsync();
}
