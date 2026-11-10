using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using Portfolio.Api.Blog.Controllers;
using Portfolio.Application.Blog.Requests;
using Portfolio.Application.Blog.Responses;
using Portfolio.Application.Content.Responses;
using Portfolio.Application.Content.Services;
using Portfolio.Domain.Content;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class PostsControllerTests
{
    private readonly IContentService _serviceMock = Substitute.For<IContentService>();
    private readonly PostsController _controller;

    public PostsControllerTests()
    {
        _controller = new PostsController(_serviceMock);
    }

    [Fact]
    public async Task ListAsync_ReturnsPosts()
    {
        var posts = new List<ContentResponse> { new() { Id = Guid.NewGuid(), Title = "Test", Slug = "test", Content = "content", DatePosted = DateTime.UtcNow, ResumeProfileId = Guid.NewGuid(), AuthorName = "user" } };
        _serviceMock.ListAsync(ContentType.Blog).Returns(posts);

        var result = await _controller.ListAsync();

        result.ShouldBe(posts);
    }

    [Fact]
    public async Task GetAsync_ReturnsPost_WhenFound()
    {
        var id = Guid.NewGuid();
        var post = new ContentResponse { Id = id, Title = "Test", Slug = "test", Content = "content", DatePosted = DateTime.UtcNow, ResumeProfileId = Guid.NewGuid(), AuthorName = "user" };
        _serviceMock.GetAsync(id, ContentType.Blog).Returns(post);

        var result = await _controller.GetAsync(id);

        var okResult = result.Result.ShouldBeOfType<OkObjectResult>();
        okResult.Value.ShouldBe(post);
    }

    [Fact]
    public async Task GetAsync_ReturnsNotFound_WhenNotFound()
    {
        var id = Guid.NewGuid();
        _serviceMock.GetAsync(id, ContentType.Blog).Returns((ContentResponse?)null);

        var result = await _controller.GetAsync(id);

        result.Result.ShouldBeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GenerateMetadataAsync_ReturnsOkWithResponse()
    {
        var request = new GenerateMetadataRequest { Title = "Title", Content = "Content" };
        var response = new GenerateMetadataResponse { Slug = "title", Summary = "Summary" };

        _serviceMock.GenerateMetadataAsync(request).Returns(response);

        var result = await _controller.GenerateMetadataAsync(request);

        var okResult = result.Result.ShouldBeOfType<OkObjectResult>();
        okResult.Value.ShouldBe(response);
    }
}
