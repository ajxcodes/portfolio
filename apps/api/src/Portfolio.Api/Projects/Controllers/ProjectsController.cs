using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portfolio.Application.Content.Requests;
using Portfolio.Application.Content.Responses;
using Portfolio.Application.Content.Services;
using Portfolio.Domain.Content;

namespace Portfolio.Api.Projects.Controllers;

[Route("api/projects")]
[ApiController]
public class ProjectsController(IContentService service) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<ContentResponse>> ListAsync() => await service.ListAsync(ContentType.Project);

    [HttpGet("{id}")]
    public async Task<ActionResult<ContentResponse>> GetAsync(Guid id)
    {
        var response = await service.GetAsync(id, ContentType.Project);
        if (response == null) return NotFound();
        return Ok(response);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ContentResponse>> CreateAsync(CreateContentRequest request)
    {
        var response = await service.CreateAsync(ContentType.Project, request);
        return Created($"/api/projects/{response.Id}", response);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ContentResponse>> UpdateAsync(Guid id, UpdateContentRequest request)
    {
        var username = User.Identity?.Name ?? "Admin";
        var response = await service.UpdateAsync(id, ContentType.Project, request, username);
        if (response == null) return NotFound();
        return Ok(response);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteAsync(Guid id)
    {
        await service.DeleteAsync(id, ContentType.Project);
        return NoContent();
    }

    [HttpPut("{id}/start-date")]
    [Authorize]
    public async Task<ActionResult<ContentResponse>> UpdateStartDateAsync(Guid id, UpdateStartDateRequest request)
    {
        var response = await service.UpdateStartDateAsync(id, request.StartDate);
        if (response == null) return NotFound();
        return Ok(response);
    }
}
