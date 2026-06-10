using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Portfolio.Application.Resume.Services;
using Portfolio.Application.Storage.Services;
using Portfolio.Domain.Resume;

namespace Portfolio.Api.Resume.Controllers;

[ApiController]
[Route("api/resume")]
public class ResumeController(
    IResumeService service,
    IStorageService? storageService = null,
    IResumePdfGenerator? pdfGenerator = null) : ControllerBase
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

    [HttpGet("{id:guid}", Name = "GetResumeById")]
    [Authorize]
    public async Task<ActionResult<ResumeProfile>> GetById(Guid id)
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
        var createdProfile = await service.CreateProfileWithDetailsAsync(request);
        return CreatedAtRoute("GetResumeById", new { id = createdProfile.Id }, createdProfile);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateAsync(Guid id, [FromBody] UpdateResumeRequest request)
    {
        try
        {
            await service.UpdateProfileWithDetailsAsync(id, request);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
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

