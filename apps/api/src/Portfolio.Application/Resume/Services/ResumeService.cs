using Portfolio.Application.Resume.Contracts.Requests;
using Portfolio.Application.Resume.Contracts.Responses;
using Portfolio.Application.Resume.Repositories;
using Portfolio.Domain.Resume;

namespace Portfolio.Application.Resume.Services;

public interface IResumeService
{
    Task<ResumeProfileResponse?> GetActiveProfileAsync();
    Task<List<ResumeProfileResponse>> ListProfilesAsync();
    Task<ResumeProfileResponse?> GetProfileByIdAsync(Guid id);
    Task<ResumeProfileResponse> CreateProfileAsync(CreateResumeRequest request);
    Task UpdateProfileAsync(Guid id, UpdateResumeRequest request);
    Task<ResumeProfileResponse> CreateProfileWithDetailsAsync(CreateResumeRequest request);
    Task UpdateProfileWithDetailsAsync(Guid id, UpdateResumeRequest request);
    Task DeleteProfileAsync(Guid id);
    Task ActivateProfileAsync(Guid id);
    Task<List<SkillCategoryResponse>> ListSkillsAsync();
    Task<SkillCategoryResponse> CreateSkillCategoryAsync(CreateSkillCategoryRequest request);
    Task UpdateSkillCategoryAsync(Guid id, UpdateSkillCategoryRequest request);
    Task DeleteSkillCategoryAsync(Guid id);
    Task<SkillResponse> CreateSkillAsync(CreateSkillRequest request);
    Task UpdateSkillAsync(Guid id, UpdateSkillRequest request);
    Task DeleteSkillAsync(Guid id);
}

public class ResumeService(IResumeRepository repository) : IResumeService
{
    public async Task<ResumeProfileResponse?> GetActiveProfileAsync()
    {
        var profile = await repository.GetActiveProfileAsync();
        return profile == null ? null : MapToResponse(profile);
    }

    public async Task<List<ResumeProfileResponse>> ListProfilesAsync()
    {
        var profiles = await repository.ListProfilesAsync();
        return profiles.Select(MapToResponse).ToList();
    }

    public async Task<ResumeProfileResponse?> GetProfileByIdAsync(Guid id)
    {
        var profile = await repository.GetProfileByIdAsync(id);
        return profile == null ? null : MapToResponse(profile);
    }

    public Task<ResumeProfileResponse> CreateProfileAsync(CreateResumeRequest request)
    {
        return CreateProfileWithDetailsAsync(request);
    }

    public Task UpdateProfileAsync(Guid id, UpdateResumeRequest request)
    {
        return UpdateProfileWithDetailsAsync(id, request);
    }

    public async Task DeleteProfileAsync(Guid id)
    {
        await repository.DeleteProfileAsync(id);
        await repository.SaveChangesAsync();
    }

    public async Task<ResumeProfileResponse> CreateProfileWithDetailsAsync(CreateResumeRequest request)
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
                    DisplayInHeader = linkDto.DisplayInHeader,
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
        var savedProfile = await repository.GetProfileByIdAsync(profile.Id);
        return MapToResponse(savedProfile ?? profile);
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
                    DisplayInHeader = linkDto.DisplayInHeader,
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

    public async Task<List<SkillCategoryResponse>> ListSkillsAsync()
    {
        var categories = await repository.ListSkillsAsync();
        return categories.Select(MapSkillCategoryToResponse).ToList();
    }

    public async Task<SkillCategoryResponse> CreateSkillCategoryAsync(CreateSkillCategoryRequest request)
    {
        var category = new SkillCategory
        {
            Id = Guid.CreateVersion7(),
            CategoryName = request.CategoryName,
            IconName = request.IconName,
            DisplayOrder = request.DisplayOrder
        };
        await repository.AddSkillCategoryAsync(category);
        await repository.SaveChangesAsync();
        return MapSkillCategoryToResponse(category);
    }

    public async Task UpdateSkillCategoryAsync(Guid id, UpdateSkillCategoryRequest request)
    {
        var category = new SkillCategory
        {
            Id = id,
            CategoryName = request.CategoryName,
            IconName = request.IconName,
            DisplayOrder = request.DisplayOrder
        };
        await repository.UpdateSkillCategoryAsync(category);
        await repository.SaveChangesAsync();
    }

    public async Task DeleteSkillCategoryAsync(Guid id)
    {
        await repository.DeleteSkillCategoryAsync(id);
        await repository.SaveChangesAsync();
    }

    public async Task<SkillResponse> CreateSkillAsync(CreateSkillRequest request)
    {
        var skill = new Skill
        {
            Id = Guid.CreateVersion7(),
            CategoryId = request.CategoryId,
            SkillName = request.SkillName,
            DisplayOrder = request.DisplayOrder
        };
        await repository.AddSkillAsync(skill);
        await repository.SaveChangesAsync();
        return MapSkillToResponse(skill);
    }

    public async Task UpdateSkillAsync(Guid id, UpdateSkillRequest request)
    {
        var skill = new Skill
        {
            Id = id,
            CategoryId = request.CategoryId,
            SkillName = request.SkillName,
            DisplayOrder = request.DisplayOrder
        };
        await repository.UpdateSkillAsync(skill);
        await repository.SaveChangesAsync();
    }

    public async Task DeleteSkillAsync(Guid id)
    {
        await repository.DeleteSkillAsync(id);
        await repository.SaveChangesAsync();
    }

    public static ResumeProfileResponse MapToResponse(ResumeProfile profile)
    {
        return new ResumeProfileResponse
        {
            Id = profile.Id,
            Name = profile.Name,
            Title = profile.Title,
            Intro = profile.Intro,
            PhotoUrlLight = profile.PhotoUrlLight,
            PhotoUrlDark = profile.PhotoUrlDark,
            IsActive = profile.IsActive,
            UpdatedAt = profile.UpdatedAt,
            Links = profile.Links?.Select(l => new ResumeProfileLinkResponse
            {
                Id = l.Id,
                ProfileId = l.ProfileId,
                LinkTypeId = l.LinkTypeId,
                Url = l.Url,
                DisplayInHeader = l.DisplayInHeader,
                LinkType = l.LinkType == null ? null : new ResumeLinkTypeResponse
                {
                    Id = l.LinkType.Id,
                    Name = l.LinkType.Name,
                    KeyIdentifier = l.LinkType.KeyIdentifier
                }
            }).ToList() ?? new(),
            WorkExperiences = profile.WorkExperiences?.OrderBy(we => we.DisplayOrder).Select(we => new WorkExperienceResponse
            {
                Id = we.Id,
                ProfileId = we.ProfileId,
                Company = we.Company,
                Role = we.Role,
                Period = we.Period,
                Location = we.Location,
                IsPrevious = we.IsPrevious,
                DisplayOrder = we.DisplayOrder,
                Highlights = we.Highlights?.OrderBy(h => h.DisplayOrder).Select(h => new ExperienceHighlightResponse
                {
                    Id = h.Id,
                    ExperienceId = h.ExperienceId,
                    ResultText = h.ResultText,
                    DisplayOrder = h.DisplayOrder
                }).ToList() ?? new(),
                WorkExperienceSkills = we.WorkExperienceSkills?.Select(wes => new WorkExperienceSkillResponse
                {
                    WorkExperienceId = wes.WorkExperienceId,
                    SkillId = wes.SkillId,
                    Skill = wes.Skill == null ? null : new SkillResponse
                    {
                        Id = wes.Skill.Id,
                        CategoryId = wes.Skill.CategoryId,
                        SkillName = wes.Skill.SkillName,
                        DisplayOrder = wes.Skill.DisplayOrder
                    }
                }).ToList() ?? new()
            }).ToList() ?? new()
        };
    }

    public static SkillCategoryResponse MapSkillCategoryToResponse(SkillCategory category)
    {
        return new SkillCategoryResponse
        {
            Id = category.Id,
            CategoryName = category.CategoryName,
            IconName = category.IconName,
            DisplayOrder = category.DisplayOrder,
            Skills = category.Skills?.Select(MapSkillToResponse).ToList() ?? new()
        };
    }

    public static SkillResponse MapSkillToResponse(Skill skill)
    {
        return new SkillResponse
        {
            Id = skill.Id,
            CategoryId = skill.CategoryId,
            SkillName = skill.SkillName,
            DisplayOrder = skill.DisplayOrder
        };
    }
}
