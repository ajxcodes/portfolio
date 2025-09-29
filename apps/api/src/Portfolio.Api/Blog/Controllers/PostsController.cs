using Microsoft.AspNetCore.Mvc;
using Portfolio.Application.Blog.Responses;
using Portfolio.Application.Blog.Services;

namespace Portfolio.Api.Blog.Controllers;

[Route("api/blog/posts")]
[ApiController]
public class PostsController(IPostService service) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<PostResponse>> ListAsync() => await service.ListAsync();
}