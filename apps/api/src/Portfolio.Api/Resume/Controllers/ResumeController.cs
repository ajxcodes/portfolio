using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Portfolio.Application.Resume.Services;
using Portfolio.Application.Storage.Services;
using Portfolio.Domain.Resume;
using Portfolio.Infrastructure.Database.Contexts;

namespace Portfolio.Api.Resume.Controllers;

[ApiController]
[Route("api/resume")]
public class ResumeController(
    IResumeService service,
    IStorageService? storageService = null,
    IResumePdfGenerator? pdfGenerator = null,
    PortfolioDbContext? context = null) : ControllerBase
{
    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<ActionResult<ResumeProfile>> GetActiveAsync()
    {
        var activeProfile = await service.GetActiveProfileAsync();
        if (activeProfile == null)
        {
            return NotFound("No active profile configured");
        }
        return Ok(activeProfile);
    }

    [HttpPost("active/download")]
    [AllowAnonymous]
    public async Task<IActionResult> PrepareDownloadAsync()
    {
        if (storageService == null || pdfGenerator == null)
        {
            return StatusCode(500, "PDF generation or storage services are not configured.");
        }

        var activeProfile = await service.GetActiveProfileAsync();
        if (activeProfile == null)
        {
            return NotFound("No active profile configured");
        }

        var skillCategories = await service.ListSkillsAsync();
        
        var updatedAtTicks = activeProfile.UpdatedAt.Ticks;
        var customKey = $"resumes/resume_{activeProfile.Id}_{updatedAtTicks}.pdf";

        // Check if already cached in S3/MinIO
        var existingUrl = await storageService.GetFileUrlIfExistsAsync(customKey);
        if (!string.IsNullOrEmpty(existingUrl))
        {
            return Ok(new { DownloadUrl = existingUrl });
        }

        // Generate PDF
        var pdfBytes = pdfGenerator.GeneratePdf(activeProfile, skillCategories);

        // Upload to S3
        using var ms = new MemoryStream(pdfBytes);
        var uploadUrl = await storageService.UploadFileAsync(ms, "resume.pdf", "application/pdf", customKey);

        return Ok(new { DownloadUrl = uploadUrl });
    }

    [HttpGet("skills")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<SkillCategory>>> GetSkillsAsync()
    {
        var skills = await service.ListSkillsAsync();
        return Ok(skills);
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<ResumeProfile>>> GetAllAsync()
    {
        var profiles = await service.ListProfilesAsync();
        return Ok(profiles);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ResumeProfile>> GetByIdAsync(Guid id)
    {
        var profile = await service.GetProfileByIdAsync(id);
        if (profile == null)
        {
            return NotFound($"Profile with ID {id} not found");
        }
        return Ok(profile);
    }

    [HttpPost("{id}/activate")]
    [Authorize]
    public async Task<IActionResult> ActivateAsync(Guid id)
    {
        try
        {
            await service.ActivateProfileAsync(id);
            return Ok(new { Success = true, Message = $"Profile {id} activated" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ResumeProfile>> CreateAsync([FromBody] CreateResumeRequest request)
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

        var createdProfile = await service.CreateProfileAsync(profile);

        if (context != null)
        {
            // Add links
            if (request.Links != null)
            {
                foreach (var linkDto in request.Links)
                {
                    var linkType = await context.ResumeProfileLinkTypes
                        .FirstOrDefaultAsync(lt => lt.KeyIdentifier == linkDto.LinkTypeKey);
                    if (linkType == null)
                    {
                        linkType = new ResumeProfileLinkType
                        {
                            Id = Guid.CreateVersion7(),
                            Name = linkDto.LinkTypeName,
                            KeyIdentifier = linkDto.LinkTypeKey
                        };
                        await context.ResumeProfileLinkTypes.AddAsync(linkType);
                    }
                    var profileLink = new ResumeProfileLink
                    {
                        Id = Guid.CreateVersion7(),
                        ProfileId = profile.Id,
                        LinkTypeId = linkType.Id,
                        Url = linkDto.Url,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await context.ResumeProfileLinks.AddAsync(profileLink);
                }
            }

            // Add work experiences
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
                    await context.WorkExperiences.AddAsync(experience);

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
                            await context.ExperienceHighlights.AddAsync(highlight);
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
                            await context.WorkExperienceSkills.AddAsync(wes);
                        }
                    }
                }
            }

            await context.SaveChangesAsync();
        }

        return CreatedAtAction(nameof(GetByIdAsync), new { id = createdProfile.Id }, createdProfile);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateAsync(Guid id, [FromBody] UpdateResumeRequest request)
    {
        var profile = await service.GetProfileByIdAsync(id);
        if (profile == null)
        {
            return NotFound($"Profile with ID {id} not found");
        }

        profile.Name = request.Name;
        profile.Title = request.Title;
        profile.Intro = request.Intro;
        profile.PhotoUrlLight = request.PhotoUrlLight ?? profile.PhotoUrlLight;
        profile.PhotoUrlDark = request.PhotoUrlDark ?? profile.PhotoUrlDark;
        profile.UpdatedAt = DateTime.UtcNow;

        await service.UpdateProfileAsync(profile);

        if (context != null)
        {
            // Delete old links
            var oldLinks = await context.ResumeProfileLinks.Where(l => l.ProfileId == id).ToListAsync();
            context.ResumeProfileLinks.RemoveRange(oldLinks);

            // Add new links
            if (request.Links != null)
            {
                foreach (var linkDto in request.Links)
                {
                    var linkType = await context.ResumeProfileLinkTypes
                        .FirstOrDefaultAsync(lt => lt.KeyIdentifier == linkDto.LinkTypeKey);
                    if (linkType == null)
                    {
                        linkType = new ResumeProfileLinkType
                        {
                            Id = Guid.CreateVersion7(),
                            Name = linkDto.LinkTypeName,
                            KeyIdentifier = linkDto.LinkTypeKey
                        };
                        await context.ResumeProfileLinkTypes.AddAsync(linkType);
                    }
                    var profileLink = new ResumeProfileLink
                    {
                        Id = Guid.CreateVersion7(),
                        ProfileId = id,
                        LinkTypeId = linkType.Id,
                        Url = linkDto.Url,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await context.ResumeProfileLinks.AddAsync(profileLink);
                }
            }

            // Delete old work experiences
            var oldExps = await context.WorkExperiences.Where(we => we.ProfileId == id).ToListAsync();
            context.WorkExperiences.RemoveRange(oldExps);

            // Add new work experiences
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
                    await context.WorkExperiences.AddAsync(experience);

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
                            await context.ExperienceHighlights.AddAsync(highlight);
                        }
                    }

                    if (expDto.SkillIds == null) continue;
                    foreach (var skillId in expDto.SkillIds)
                    {
                        var wes = new WorkExperienceSkill
                        {
                            WorkExperienceId = experience.Id,
                            SkillId = skillId
                        };
                        await context.WorkExperienceSkills.AddAsync(wes);
                    }
                }
            }

            await context.SaveChangesAsync();
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteAsync(Guid id)
    {
        var profile = await service.GetProfileByIdAsync(id);
        if (profile == null)
        {
            return NotFound($"Profile with ID {id} not found");
        }

        if (profile.IsActive)
        {
            return BadRequest("Cannot delete the currently active profile");
        }

        await service.DeleteProfileAsync(id);
        return NoContent();
    }
}

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
