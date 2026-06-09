using Portfolio.Application.Resume.Repositories;
using Portfolio.Domain.Resume;

namespace Portfolio.Application.Resume.Services;

public class ResumeLinkDto
{
    public string LinkTypeName { get; set; } = string.Empty;
    public string LinkTypeKey { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

public class WorkExperienceDto
{
    public string Company { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string? Location { get; set; }
    public bool IsPrevious { get; set; }
    public int DisplayOrder { get; set; }
    public List<string> Highlights { get; set; } = new();
    public List<Guid>? SkillIds { get; set; }
}

public class CreateResumeRequest
{
    public string Name { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Intro { get; init; } = string.Empty;
    public string? PhotoUrlLight { get; init; }
    public string? PhotoUrlDark { get; init; }
    public List<ResumeLinkDto>? Links { get; set; }
    public List<WorkExperienceDto>? WorkExperiences { get; set; }
}

public class UpdateResumeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Intro { get; set; } = string.Empty;
    public string? PhotoUrlLight { get; set; }
    public string? PhotoUrlDark { get; set; }
    public List<ResumeLinkDto>? Links { get; set; }
    public List<WorkExperienceDto>? WorkExperiences { get; set; }
}

public interface IResumeService
{
    Task<ResumeProfile?> GetActiveProfileAsync();
    Task<List<ResumeProfile>> ListProfilesAsync();
    Task<ResumeProfile?> GetProfileByIdAsync(Guid id);
    Task<ResumeProfile> CreateProfileAsync(ResumeProfile profile);
    Task UpdateProfileAsync(ResumeProfile profile);
    Task<ResumeProfile> CreateProfileWithDetailsAsync(CreateResumeRequest request);
    Task UpdateProfileWithDetailsAsync(Guid id, UpdateResumeRequest request);
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

    public async Task<ResumeProfile> CreateProfileWithDetailsAsync(CreateResumeRequest request)
    {
        var profile = new ResumeProfile
        {
            Id = Guid.CreateVersion7(),
            Name = request.Name,
            Title = request.Title,
            Intro = request.Intro,
            PhotoUrlLight = request.PhotoUrlLight ?? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
            PhotoUrlDark = request.PhotoUrlDark ?? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
            IsActive = false,
            UpdatedAt = DateTime.UtcNow
        };

        await repository.AddProfileAsync(profile);

        if (request.Links != null)
        {
            foreach (var linkDto in request.Links)
            {
                var linkType = await repository.GetLinkTypeByKeyAsync(linkDto.LinkTypeKey);
                if (linkType == null)
                {
                    linkType = new ResumeProfileLinkType
                    {
                        Id = Guid.CreateVersion7(),
                        Name = linkDto.LinkTypeName,
                        KeyIdentifier = linkDto.LinkTypeKey
                    };
                    await repository.AddProfileLinkTypeAsync(linkType);
                }
                var profileLink = new ResumeProfileLink
                {
                    Id = Guid.CreateVersion7(),
                    ProfileId = profile.Id,
                    LinkTypeId = linkType.Id,
                    Url = linkDto.Url,
                    UpdatedAt = DateTime.UtcNow
                };
                await repository.AddProfileLinkAsync(profileLink);
            }
        }

        if (request.WorkExperiences != null)
        {
            foreach (var expDto in request.WorkExperiences)
            {
                var experience = new WorkExperience
                {
                    Id = Guid.CreateVersion7(),
                    ProfileId = profile.Id,
                    Company = expDto.Company,
                    Role = expDto.Role,
                    Period = expDto.Period,
                    Location = expDto.Location,
                    IsPrevious = expDto.IsPrevious,
                    DisplayOrder = expDto.DisplayOrder
                };
                await repository.AddWorkExperienceAsync(experience);

                if (expDto.Highlights.Count > 0)
                {
                    int hOrder = 0;
                    foreach (var text in expDto.Highlights)
                    {
                        var highlight = new ExperienceHighlight
                        {
                            Id = Guid.CreateVersion7(),
                            ExperienceId = experience.Id,
                            ResultText = text,
                            DisplayOrder = hOrder++
                        };
                        await repository.AddExperienceHighlightAsync(highlight);
                    }
                }

                if (expDto.SkillIds != null)
                {
                    foreach (var skillId in expDto.SkillIds)
                    {
                        var wes = new WorkExperienceSkill
                        {
                            WorkExperienceId = experience.Id,
                            SkillId = skillId
                        };
                        await repository.AddWorkExperienceSkillAsync(wes);
                    }
                }
            }
        }

        await repository.SaveChangesAsync();
        return profile;
    }

    public async Task UpdateProfileWithDetailsAsync(Guid id, UpdateResumeRequest request)
    {
        var profile = await repository.GetProfileByIdAsync(id);
        if (profile == null)
            throw new KeyNotFoundException($"Profile with ID {id} not found");

        profile.Name = request.Name;
        profile.Title = request.Title;
        profile.Intro = request.Intro;
        profile.PhotoUrlLight = request.PhotoUrlLight ?? profile.PhotoUrlLight;
        profile.PhotoUrlDark = request.PhotoUrlDark ?? profile.PhotoUrlDark;
        profile.UpdatedAt = DateTime.UtcNow;

        await repository.UpdateProfileAsync(profile);

        await repository.RemoveLinksByProfileIdAsync(id);
        if (request.Links != null)
        {
            foreach (var linkDto in request.Links)
            {
                var linkType = await repository.GetLinkTypeByKeyAsync(linkDto.LinkTypeKey);
                if (linkType == null)
                {
                    linkType = new ResumeProfileLinkType
                    {
                        Id = Guid.CreateVersion7(),
                        Name = linkDto.LinkTypeName,
                        KeyIdentifier = linkDto.LinkTypeKey
                    };
                    await repository.AddProfileLinkTypeAsync(linkType);
                }
                var profileLink = new ResumeProfileLink
                {
                    Id = Guid.CreateVersion7(),
                    ProfileId = id,
                    LinkTypeId = linkType.Id,
                    Url = linkDto.Url,
                    UpdatedAt = DateTime.UtcNow
                };
                await repository.AddProfileLinkAsync(profileLink);
            }
        }

        await repository.RemoveWorkExperiencesByProfileIdAsync(id);
        if (request.WorkExperiences != null)
        {
            foreach (var expDto in request.WorkExperiences)
            {
                var experience = new WorkExperience
                {
                    Id = Guid.CreateVersion7(),
                    ProfileId = id,
                    Company = expDto.Company,
                    Role = expDto.Role,
                    Period = expDto.Period,
                    Location = expDto.Location,
                    IsPrevious = expDto.IsPrevious,
                    DisplayOrder = expDto.DisplayOrder
                };
                await repository.AddWorkExperienceAsync(experience);

                if (expDto.Highlights.Count > 0)
                {
                    var hOrder = 0;
                    foreach (var text in expDto.Highlights)
                    {
                        var highlight = new ExperienceHighlight
                        {
                            Id = Guid.CreateVersion7(),
                            ExperienceId = experience.Id,
                            ResultText = text,
                            DisplayOrder = hOrder++
                        };
                        await repository.AddExperienceHighlightAsync(highlight);
                    }
                }

                if (expDto.SkillIds != null)
                {
                    foreach (var skillId in expDto.SkillIds)
                    {
                        var wes = new WorkExperienceSkill
                        {
                            WorkExperienceId = experience.Id,
                            SkillId = skillId
                        };
                        await repository.AddWorkExperienceSkillAsync(wes);
                    }
                }
            }
        }

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
