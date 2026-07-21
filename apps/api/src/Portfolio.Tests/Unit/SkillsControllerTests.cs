using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using Portfolio.Api.Resume.Controllers;
using Portfolio.Application.Resume.Contracts.Requests;
using Portfolio.Application.Resume.Contracts.Responses;
using Portfolio.Application.Resume.Services;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class SkillsControllerTests
{
    private readonly IResumeService _serviceMock = Substitute.For<IResumeService>();
    private readonly SkillsController _controller;

    public SkillsControllerTests()
    {
        _controller = new SkillsController(_serviceMock);
    }

    [Fact]
    public async Task CreateCategoryAsync_ReturnsOk_WithCategory()
    {
        var request = new CreateSkillCategoryRequest { CategoryName = "Cat", DisplayOrder = 1 };
        var expectedResponse = new SkillCategoryResponse { Id = Guid.NewGuid(), CategoryName = "Cat", DisplayOrder = 1 };
        _serviceMock.CreateSkillCategoryAsync(request).Returns(expectedResponse);

        var result = await _controller.CreateCategoryAsync(request);

        var okResult = result.Result.ShouldBeOfType<OkObjectResult>();
        var category = okResult.Value.ShouldBeOfType<SkillCategoryResponse>();
        category.CategoryName.ShouldBe("Cat");
    }

    [Fact]
    public async Task UpdateCategoryAsync_ReturnsNoContent()
    {
        var request = new UpdateSkillCategoryRequest { CategoryName = "Cat2" };
        var id = Guid.NewGuid();

        var result = await _controller.UpdateCategoryAsync(id, request);

        result.ShouldBeOfType<NoContentResult>();
        await _serviceMock.Received(1).UpdateSkillCategoryAsync(id, request);
    }

    [Fact]
    public async Task DeleteCategoryAsync_ReturnsNoContent()
    {
        var id = Guid.NewGuid();

        var result = await _controller.DeleteCategoryAsync(id);

        result.ShouldBeOfType<NoContentResult>();
        await _serviceMock.Received(1).DeleteSkillCategoryAsync(id);
    }

    [Fact]
    public async Task CreateSkillAsync_ReturnsOk_WithSkill()
    {
        var request = new CreateSkillRequest { SkillName = "Skill", CategoryId = Guid.NewGuid() };
        var expectedResponse = new SkillResponse { Id = Guid.NewGuid(), SkillName = "Skill", CategoryId = request.CategoryId };
        _serviceMock.CreateSkillAsync(request).Returns(expectedResponse);

        var result = await _controller.CreateSkillAsync(request);

        var okResult = result.Result.ShouldBeOfType<OkObjectResult>();
        var skill = okResult.Value.ShouldBeOfType<SkillResponse>();
        skill.SkillName.ShouldBe("Skill");
    }

    [Fact]
    public async Task UpdateSkillAsync_ReturnsNoContent()
    {
        var request = new UpdateSkillRequest { SkillName = "Skill2", CategoryId = Guid.NewGuid() };
        var id = Guid.NewGuid();

        var result = await _controller.UpdateSkillAsync(id, request);

        result.ShouldBeOfType<NoContentResult>();
        await _serviceMock.Received(1).UpdateSkillAsync(id, request);
    }

    [Fact]
    public async Task DeleteSkillAsync_ReturnsNoContent()
    {
        var id = Guid.NewGuid();

        var result = await _controller.DeleteSkillAsync(id);

        result.ShouldBeOfType<NoContentResult>();
        await _serviceMock.Received(1).DeleteSkillAsync(id);
    }
}
