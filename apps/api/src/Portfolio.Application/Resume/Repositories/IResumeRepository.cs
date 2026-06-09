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
    Task UpdateSkillCategoryAsync(SkillCategory category);
    Task DeleteSkillCategoryAsync(Guid id);
    Task AddSkillAsync(Skill skill);
    Task UpdateSkillAsync(Skill skill);
    Task DeleteSkillAsync(Guid id);

    Task AddWorkExperienceAsync(WorkExperience experience);
    Task DeleteWorkExperienceAsync(Guid id);

    Task<ResumeProfileLinkType?> GetLinkTypeByKeyAsync(string key);
    Task AddProfileLinkTypeAsync(ResumeProfileLinkType linkType);
    Task AddProfileLinkAsync(ResumeProfileLink profileLink);
    Task AddExperienceHighlightAsync(ExperienceHighlight highlight);
    Task AddWorkExperienceSkillAsync(WorkExperienceSkill experienceSkill);
    Task RemoveLinksByProfileIdAsync(Guid profileId);
    Task RemoveWorkExperiencesByProfileIdAsync(Guid profileId);

    Task SaveChangesAsync();
}
