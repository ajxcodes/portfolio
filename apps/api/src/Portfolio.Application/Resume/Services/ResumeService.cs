using System;
using System.Collections.Generic;
using System.Threading.Tasks;
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

        var profiles = await repository.ListProfilesAsync();
        foreach (var profile in profiles)
        {
            profile.IsActive = (profile.Id == id);
            profile.UpdatedAt = DateTime.UtcNow;
            await repository.UpdateProfileAsync(profile);
        }

        await repository.SaveChangesAsync();
    }
}
