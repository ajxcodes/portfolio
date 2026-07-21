using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portfolio.Application.Resume.Contracts.Requests;
using Portfolio.Application.Resume.Contracts.Responses;
using Portfolio.Application.Resume.Services;

namespace Portfolio.Api.Resume.Controllers;

[ApiController]
[Route("api/resume/skills")]
[Authorize]
public class SkillsController(IResumeService service) : ControllerBase
{
    [HttpPost("categories")]
    public async Task<ActionResult<SkillCategoryResponse>> CreateCategoryAsync([FromBody] CreateSkillCategoryRequest request)
    {
        var created = await service.CreateSkillCategoryAsync(request);
        return Ok(created);
    }

    [HttpPut("categories/{id}")]
    public async Task<IActionResult> UpdateCategoryAsync(Guid id, [FromBody] UpdateSkillCategoryRequest request)
    {
        await service.UpdateSkillCategoryAsync(id, request);
        return NoContent();
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategoryAsync(Guid id)
    {
        await service.DeleteSkillCategoryAsync(id);
        return NoContent();
    }

    [HttpPost]
    public async Task<ActionResult<SkillResponse>> CreateSkillAsync([FromBody] CreateSkillRequest request)
    {
        var created = await service.CreateSkillAsync(request);
        return Ok(created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSkillAsync(Guid id, [FromBody] UpdateSkillRequest request)
    {
        await service.UpdateSkillAsync(id, request);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSkillAsync(Guid id)
    {
        await service.DeleteSkillAsync(id);
        return NoContent();
    }
}
