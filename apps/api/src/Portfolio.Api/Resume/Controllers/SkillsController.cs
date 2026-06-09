using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portfolio.Application.Resume.Services;
using Portfolio.Domain.Resume;

namespace Portfolio.Api.Resume.Controllers;

[ApiController]
[Route("api/resume/skills")]
[Authorize]
public class SkillsController(IResumeService service) : ControllerBase
{
    [HttpPost("categories")]
    public async Task<ActionResult<SkillCategory>> CreateCategoryAsync([FromBody] CreateSkillCategoryDto request)
    {
        var category = new SkillCategory
        {
            Id = Guid.CreateVersion7(),
            CategoryName = request.CategoryName,
            IconName = request.IconName,
            DisplayOrder = request.DisplayOrder
        };

        var created = await service.CreateSkillCategoryAsync(category);
        return Ok(created);
    }

    [HttpPut("categories/{id}")]
    public async Task<IActionResult> UpdateCategoryAsync(Guid id, [FromBody] UpdateSkillCategoryDto request)
    {
        var category = new SkillCategory
        {
            Id = id,
            CategoryName = request.CategoryName,
            IconName = request.IconName,
            DisplayOrder = request.DisplayOrder
        };

        await service.UpdateSkillCategoryAsync(category);
        return NoContent();
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategoryAsync(Guid id)
    {
        await service.DeleteSkillCategoryAsync(id);
        return NoContent();
    }

    [HttpPost]
    public async Task<ActionResult<Skill>> CreateSkillAsync([FromBody] CreateSkillDto request)
    {
        var skill = new Skill
        {
            Id = Guid.CreateVersion7(),
            CategoryId = request.CategoryId,
            SkillName = request.SkillName,
            DisplayOrder = request.DisplayOrder
        };

        var created = await service.CreateSkillAsync(skill);
        return Ok(created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSkillAsync(Guid id, [FromBody] UpdateSkillDto request)
    {
        var skill = new Skill
        {
            Id = id,
            CategoryId = request.CategoryId,
            SkillName = request.SkillName,
            DisplayOrder = request.DisplayOrder
        };

        await service.UpdateSkillAsync(skill);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSkillAsync(Guid id)
    {
        await service.DeleteSkillAsync(id);
        return NoContent();
    }
}

public class CreateSkillCategoryDto
{
    public string CategoryName { get; set; } = string.Empty;
    public string? IconName { get; set; }
    public int DisplayOrder { get; set; }
}

public class UpdateSkillCategoryDto
{
    public string CategoryName { get; set; } = string.Empty;
    public string? IconName { get; set; }
    public int DisplayOrder { get; set; }
}

public class CreateSkillDto
{
    public Guid CategoryId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public class UpdateSkillDto
{
    public Guid CategoryId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}
