using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using Portfolio.Api.Projects.Controllers;
using Portfolio.Application.Content.Requests;
using Portfolio.Application.Content.Responses;
using Portfolio.Application.Content.Services;
using Portfolio.Domain.Content;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class ProjectsControllerTests
{
    private readonly IContentService _serviceMock = Substitute.For<IContentService>();
    private readonly ProjectsController _controller;

    public ProjectsControllerTests()
    {
        _controller = new ProjectsController(_serviceMock);
    }

    [Fact]
    public async Task ListAsync_ReturnsProjects()
    {
        var projects = new List<ContentResponse>
        {
            new() { Id = Guid.NewGuid(), Title = "Proj", Slug = "proj", Content = "content", DatePosted = DateTime.UtcNow, ResumeProfileId = Guid.NewGuid(), AuthorName = "user" }
        };
        _serviceMock.ListAsync(ContentType.Project).Returns(projects);

        var result = await _controller.ListAsync();

        result.ShouldBe(projects);
    }

    [Fact]
    public async Task GetAsync_ReturnsProject_WhenFound()
    {
        var id = Guid.NewGuid();
        var project = new ContentResponse { Id = id, Title = "Proj", Slug = "proj", Content = "content", DatePosted = DateTime.UtcNow, ResumeProfileId = Guid.NewGuid(), AuthorName = "user" };
        _serviceMock.GetAsync(id, ContentType.Project).Returns(project);

        var result = await _controller.GetAsync(id);

        var okResult = result.Result.ShouldBeOfType<OkObjectResult>();
        okResult.Value.ShouldBe(project);
    }

    [Fact]
    public async Task GetAsync_ReturnsNotFound_WhenNotFound()
    {
        var id = Guid.NewGuid();
        _serviceMock.GetAsync(id, ContentType.Project).Returns((ContentResponse?)null);

        var result = await _controller.GetAsync(id);

        result.Result.ShouldBeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task UpdateStartDateAsync_ReturnsOkWithUpdatedProject_AndNotFoundForUnknownId()
    {
        var id = Guid.NewGuid();
        var post = new ContentResponse { Id = id, Title = "Proj", Slug = "proj", Content = "content", DatePosted = DateTime.UtcNow, ResumeProfileId = Guid.NewGuid(), AuthorName = "user" };
        _serviceMock.UpdateStartDateAsync(id, Arg.Any<DateTime?>()).Returns(post);

        var okResult = await _controller.UpdateStartDateAsync(id, new UpdateStartDateRequest { StartDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc) });

        var ok = okResult.Result.ShouldBeOfType<OkObjectResult>();
        ok.Value.ShouldBe(post);

        var missingId = Guid.NewGuid();
        _serviceMock.UpdateStartDateAsync(missingId, Arg.Any<DateTime?>()).Returns((ContentResponse?)null);

        var missing = await _controller.UpdateStartDateAsync(missingId, new UpdateStartDateRequest());

        missing.Result.ShouldBeOfType<NotFoundResult>();
    }
}
