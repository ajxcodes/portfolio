using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portfolio.Application.Resume.Services;
using Portfolio.Domain.Resume;

namespace Portfolio.Api.Resume.Controllers;

[ApiController]
[Route("api/resume")]
public class ResumeController(IResumeService service) : ControllerBase
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

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<ResumeProfile>>> GetAllAsync()
    {
        var profiles = await service.ListProfilesAsync();
        return Ok(profiles);
    }

    [HttpGet("{id}")]
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

public class CreateResumeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Intro { get; set; } = string.Empty;
    public string? PhotoUrlLight { get; set; }
    public string? PhotoUrlDark { get; set; }
}

public class UpdateResumeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Intro { get; set; } = string.Empty;
    public string? PhotoUrlLight { get; set; }
    public string? PhotoUrlDark { get; set; }
}
