using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using Portfolio.Api.Resume.Controllers;
using Portfolio.Application.Resume.Services;
using Portfolio.Domain.Resume;
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
        var request = new CreateSkillCategoryDto { CategoryName = "Cat", DisplayOrder = 1 };
        _serviceMock.CreateSkillCategoryAsync(Arg.Any<SkillCategory>()).Returns(callInfo => callInfo.Arg<SkillCategory>());

        var result = await _controller.CreateCategoryAsync(request);

        var okResult = result.Result.ShouldBeOfType<OkObjectResult>();
        var category = okResult.Value.ShouldBeOfType<SkillCategory>();
        category.CategoryName.ShouldBe("Cat");
    }

    [Fact]
    public async Task UpdateCategoryAsync_ReturnsNoContent()
    {
        var request = new UpdateSkillCategoryDto { CategoryName = "Cat2" };
        var id = Guid.NewGuid();

        var result = await _controller.UpdateCategoryAsync(id, request);

        result.ShouldBeOfType<NoContentResult>();
        await _serviceMock.Received(1).UpdateSkillCategoryAsync(Arg.Is<SkillCategory>(c => c.Id == id && c.CategoryName == "Cat2"));
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
        var request = new CreateSkillDto { SkillName = "Skill", CategoryId = Guid.NewGuid() };
        _serviceMock.CreateSkillAsync(Arg.Any<Skill>()).Returns(callInfo => callInfo.Arg<Skill>());

        var result = await _controller.CreateSkillAsync(request);

        var okResult = result.Result.ShouldBeOfType<OkObjectResult>();
        var skill = okResult.Value.ShouldBeOfType<Skill>();
        skill.SkillName.ShouldBe("Skill");
    }

    [Fact]
    public async Task UpdateSkillAsync_ReturnsNoContent()
    {
        var request = new UpdateSkillDto { SkillName = "Skill2", CategoryId = Guid.NewGuid() };
        var id = Guid.NewGuid();

        var result = await _controller.UpdateSkillAsync(id, request);

        result.ShouldBeOfType<NoContentResult>();
        await _serviceMock.Received(1).UpdateSkillAsync(Arg.Is<Skill>(s => s.Id == id && s.SkillName == "Skill2"));
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
