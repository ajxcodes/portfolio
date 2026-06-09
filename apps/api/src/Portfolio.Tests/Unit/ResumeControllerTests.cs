using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using Portfolio.Api.Resume.Controllers;
using Portfolio.Application.Resume.Services;
using Portfolio.Domain.Resume;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class ResumeControllerTests
{
    private readonly IResumeService _serviceMock = Substitute.For<IResumeService>();
    private readonly ResumeController _controller;

    public ResumeControllerTests()
    {
        _controller = new ResumeController(_serviceMock);
    }

    [Fact]
    public async Task GetActiveAsync_ReturnsActiveProfile_WhenExists()
    {
        // Arrange
        var activeProfile = new ResumeProfile
        {
            Id = Guid.NewGuid(),
            Name = "John Doe",
            IsActive = true,
            Title = "Senior Dev",
            Intro = "Hello"
        };
        _serviceMock.GetActiveProfileAsync().Returns(activeProfile);

        // Act
        var result = await _controller.GetActiveAsync();

        // Assert
        var okResult = result.Result.ShouldBeOfType<OkObjectResult>();
        var profile = okResult.Value.ShouldBeOfType<ResumeProfile>();
        profile.IsActive.ShouldBeTrue();
        profile.Name.ShouldBe("John Doe");
    }

    [Fact]
    public async Task GetActiveAsync_ReturnsNotFound_WhenDoesNotExist()
    {
        // Arrange
        _serviceMock.GetActiveProfileAsync().Returns((ResumeProfile?)null);

        // Act
        var result = await _controller.GetActiveAsync();

        // Assert
        result.Result.ShouldBeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsProfile_WhenExists()
    {
        // Arrange
        var profileId = Guid.NewGuid();
        var profile = new ResumeProfile { Id = profileId, Name = "Alice", Title = "Architect", Intro = "Intro" };
        _serviceMock.GetProfileByIdAsync(profileId).Returns(profile);

        // Act
        var result = await _controller.GetByIdAsync(profileId);

        // Assert
        var okResult = result.Result.ShouldBeOfType<OkObjectResult>();
        var returnedProfile = okResult.Value.ShouldBeOfType<ResumeProfile>();
        returnedProfile.Id.ShouldBe(profileId);
    }

    [Fact]
    public async Task CreateAsync_ReturnsCreated_WithProfile()
    {
        // Arrange
        var request = new CreateResumeRequest
        {
            Name = "Bob",
            Title = "Designer",
            Intro = "Creative guy",
            PhotoUrlLight = "http://light.png",
            PhotoUrlDark = "http://dark.png"
        };
        var returnedProfile = new ResumeProfile
        {
            Id = Guid.NewGuid(),
            Name = "Bob",
            Title = "Designer",
            Intro = "Creative guy",
            IsActive = false
        };

        _serviceMock.CreateProfileWithDetailsAsync(request).Returns(returnedProfile);

        // Act
        var result = await _controller.CreateAsync(request);

        // Assert
        var createdResult = result.Result.ShouldBeOfType<CreatedAtActionResult>();
        var profile = createdResult.Value.ShouldBeOfType<ResumeProfile>();
        profile.Name.ShouldBe("Bob");
        profile.Title.ShouldBe("Designer");
        profile.IsActive.ShouldBeFalse();

        await _serviceMock.Received(1).CreateProfileWithDetailsAsync(request);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsOk_WithProfiles()
    {
        var profiles = new List<ResumeProfile> { new() { Id = Guid.NewGuid() } };
        _serviceMock.ListProfilesAsync().Returns(profiles);

        var result = await _controller.GetAllAsync();

        var okResult = result.Result.ShouldBeOfType<OkObjectResult>();
        okResult.Value.ShouldBe(profiles);
    }

    [Fact]
    public async Task ActivateAsync_ReturnsOk_WhenSuccessful()
    {
        var id = Guid.NewGuid();

        var result = await _controller.ActivateAsync(id);

        var okResult = result.ShouldBeOfType<OkObjectResult>();
        await _serviceMock.Received(1).ActivateProfileAsync(id);
    }

    [Fact]
    public async Task ActivateAsync_ReturnsNotFound_WhenProfileDoesNotExist()
    {
        var id = Guid.NewGuid();
        _serviceMock.When(x => x.ActivateProfileAsync(id)).Throw(new KeyNotFoundException("Not found"));

        var result = await _controller.ActivateAsync(id);

        result.ShouldBeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNoContent_WhenSuccessful()
    {
        var id = Guid.NewGuid();
        var request = new UpdateResumeRequest();

        var result = await _controller.UpdateAsync(id, request);

        result.ShouldBeOfType<NoContentResult>();
        await _serviceMock.Received(1).UpdateProfileWithDetailsAsync(id, request);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNotFound_WhenProfileDoesNotExist()
    {
        var id = Guid.NewGuid();
        var request = new UpdateResumeRequest();
        _serviceMock.When(x => x.UpdateProfileWithDetailsAsync(id, request)).Throw(new KeyNotFoundException("Not found"));

        var result = await _controller.UpdateAsync(id, request);

        result.ShouldBeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DeleteAsync_ReturnsNoContent_WhenSuccessful()
    {
        var id = Guid.NewGuid();
        var profile = new ResumeProfile { Id = id, IsActive = false };
        _serviceMock.GetProfileByIdAsync(id).Returns(profile);

        var result = await _controller.DeleteAsync(id);

        result.ShouldBeOfType<NoContentResult>();
        await _serviceMock.Received(1).DeleteProfileAsync(id);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsBadRequest_WhenProfileIsActive()
    {
        var id = Guid.NewGuid();
        var profile = new ResumeProfile { Id = id, IsActive = true };
        _serviceMock.GetProfileByIdAsync(id).Returns(profile);

        var result = await _controller.DeleteAsync(id);

        result.ShouldBeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task GetSkillsAsync_ReturnsOk_WithSkills()
    {
        var skills = new List<SkillCategory> { new() { Id = Guid.NewGuid() } };
        _serviceMock.ListSkillsAsync().Returns(skills);

        var result = await _controller.GetSkillsAsync();

        var okResult = result.Result.ShouldBeOfType<OkObjectResult>();
        okResult.Value.ShouldBe(skills);
    }
}
