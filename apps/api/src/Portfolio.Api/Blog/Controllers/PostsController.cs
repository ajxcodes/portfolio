using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portfolio.Application.Blog.Requests;
using Portfolio.Application.Blog.Responses;
using Portfolio.Application.Content.Requests;
using Portfolio.Application.Content.Responses;
using Portfolio.Application.Content.Services;
using Portfolio.Domain.Content;

namespace Portfolio.Api.Blog.Controllers;

[Route("api/blog/posts")]
[ApiController]
public class PostsController(IContentService service) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<ContentResponse>> ListAsync() => await service.ListAsync(ContentType.Blog);

    [HttpGet("{id}")]
    public async Task<ActionResult<ContentResponse>> GetAsync(Guid id)
    {
        var response = await service.GetAsync(id, ContentType.Blog);
        if (response == null) return NotFound();
        return Ok(response);
    }

    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<ContentResponse>> GetBySlugAsync(string slug)
    {
        var response = await service.GetBySlugAsync(slug, ContentType.Blog);
        if (response == null) return NotFound();
        return Ok(response);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ContentResponse>> CreateAsync(CreateContentRequest request)
    {
        var response = await service.CreateAsync(ContentType.Blog, request);
        return Created($"/api/blog/posts/{response.Id}", response);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ContentResponse>> UpdateAsync(Guid id, UpdateContentRequest request)
    {
        var username = User.Identity?.Name ?? "Admin";
        var response = await service.UpdateAsync(id, ContentType.Blog, request, username);
        if (response == null) return NotFound();
        return Ok(response);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteAsync(Guid id)
    {
        await service.DeleteAsync(id, ContentType.Blog);
        return NoContent();
    }

    [HttpPost("generate-metadata")]
    [Authorize]
    public async Task<ActionResult<GenerateMetadataResponse>> GenerateMetadataAsync(
        [FromBody] GenerateMetadataRequest request)
    {
        var response = await service.GenerateMetadataAsync(request);
        return Ok(response);
    }

    [HttpPost("{id}/projects/{projectId}")]
    [Authorize]
    public async Task<ActionResult<ContentResponse>> AttachProjectAsync(Guid id, Guid projectId)
    {
        var response = await service.AttachProjectAsync(id, projectId);
        if (response == null) return NotFound();
        return Ok(response);
    }

    [HttpDelete("{id}/projects/{projectId}")]
    [Authorize]
    public async Task<ActionResult<ContentResponse>> DetachProjectAsync(Guid id, Guid projectId)
    {
        var response = await service.DetachProjectAsync(id, projectId);
        if (response == null) return NotFound();
        return Ok(response);
    }
}
