using Portfolio.Application.Resume.Repositories;
using Portfolio.Domain.Resume;

namespace Portfolio.Application.Resume.Services;

public interface IResumeService
{
    Task<ResumeProfile?> GetActiveProfileAsync();
    Task<List<ResumeProfile>> ListProfilesAsync();
    Task<ResumeProfile?> GetProfileByIdAsync(Guid id);
    Task<ResumeProfile> CreateProfileAsync(ResumeProfile profile);
    Task UpdateProfileAsync(ResumeProfile profile);
    Task DeleteProfileAsync(Guid id);
    Task ActivateProfileAsync(Guid id);
    Task<List<SkillCategory>> ListSkillsAsync();
    Task<SkillCategory> CreateSkillCategoryAsync(SkillCategory category);
    Task UpdateSkillCategoryAsync(SkillCategory category);
    Task DeleteSkillCategoryAsync(Guid id);
    Task<Skill> CreateSkillAsync(Skill skill);
    Task UpdateSkillAsync(Skill skill);
    Task DeleteSkillAsync(Guid id);
}

public class ResumeService(IResumeRepository repository) : IResumeService
{
    public Task<ResumeProfile?> GetActiveProfileAsync()
    {
        return repository.GetActiveProfileAsync();
    }

    public Task<List<ResumeProfile>> ListProfilesAsync()
    {
        return repository.ListProfilesAsync();
    }

    public Task<ResumeProfile?> GetProfileByIdAsync(Guid id)
    {
        return repository.GetProfileByIdAsync(id);
    }

    public async Task<ResumeProfile> CreateProfileAsync(ResumeProfile profile)
    {
        await repository.AddProfileAsync(profile);
        await repository.SaveChangesAsync();
        return profile;
    }

    public async Task UpdateProfileAsync(ResumeProfile profile)
    {
        await repository.UpdateProfileAsync(profile);
        await repository.SaveChangesAsync();
    }

    public async Task DeleteProfileAsync(Guid id)
    {
        await repository.DeleteProfileAsync(id);
        await repository.SaveChangesAsync();
    }

    public async Task ActivateProfileAsync(Guid id)
    {
        var targetProfile = await repository.GetProfileByIdAsync(id);
        if (targetProfile == null)
        {
            throw new KeyNotFoundException($"Profile with ID {id} not found");
        }

        // Deactivate any other active profiles first to prevent database constraint violations
        var activeProfiles = (await repository.ListProfilesAsync())
            .Where(p => p.IsActive && p.Id != id)
            .ToList();

        foreach (var profile in activeProfiles)
        {
            profile.IsActive = false;
            profile.UpdatedAt = DateTime.UtcNow;
            await repository.UpdateProfileAsync(profile);
        }

        if (activeProfiles.Count > 0)
        {
            await repository.SaveChangesAsync();
        }

        // Now activate the target profile safely
        targetProfile.IsActive = true;
        targetProfile.UpdatedAt = DateTime.UtcNow;
        await repository.UpdateProfileAsync(targetProfile);
        await repository.SaveChangesAsync();
    }

    public Task<List<SkillCategory>> ListSkillsAsync()
    {
        return repository.ListSkillsAsync();
    }

    public async Task<SkillCategory> CreateSkillCategoryAsync(SkillCategory category)
    {
        await repository.AddSkillCategoryAsync(category);
        await repository.SaveChangesAsync();
        return category;
    }

    public async Task UpdateSkillCategoryAsync(SkillCategory category)
    {
        await repository.UpdateSkillCategoryAsync(category);
        await repository.SaveChangesAsync();
    }

    public async Task DeleteSkillCategoryAsync(Guid id)
    {
        await repository.DeleteSkillCategoryAsync(id);
        await repository.SaveChangesAsync();
    }

    public async Task<Skill> CreateSkillAsync(Skill skill)
    {
        await repository.AddSkillAsync(skill);
        await repository.SaveChangesAsync();
        return skill;
    }

    public async Task UpdateSkillAsync(Skill skill)
    {
        await repository.UpdateSkillAsync(skill);
        await repository.SaveChangesAsync();
    }

    public async Task DeleteSkillAsync(Guid id)
    {
        await repository.DeleteSkillAsync(id);
        await repository.SaveChangesAsync();
    }
}
