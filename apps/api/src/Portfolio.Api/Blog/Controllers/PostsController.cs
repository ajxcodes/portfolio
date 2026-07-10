using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portfolio.Application.Blog.Requests;
using Portfolio.Application.Blog.Responses;
using Portfolio.Application.Blog.Services;

namespace Portfolio.Api.Blog.Controllers;

[Route("api/blog/posts")]
[ApiController]
public class PostsController(IPostService service) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<PostResponse>> ListAsync() => await service.ListAsync();

    [HttpGet("{id}")]
    public async Task<ActionResult<PostResponse>> GetAsync(Guid id)
    {
        var response = await service.GetAsync(id);
        if (response == null) return NotFound();
        return Ok(response);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<PostResponse>> CreateAsync(CreatePostRequest request)
    {
        var username = User.Identity?.Name ?? "Admin";
        var response = await service.CreateAsync(request, username);
        return Created($"/api/blog/posts/{response.Id}", response);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<PostResponse>> UpdateAsync(Guid id, UpdatePostRequest request)
    {
        var username = User.Identity?.Name ?? "Admin";
        var response = await service.UpdateAsync(id, request, username);
        if (response == null) return NotFound();
        return Ok(response);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteAsync(Guid id)
    {
        await service.DeleteAsync(id);
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
}