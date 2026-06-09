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
        
        _serviceMock.CreateProfileAsync(Arg.Any<ResumeProfile>())
            .Returns(x => x.Arg<ResumeProfile>());

        // Act
        var result = await _controller.CreateAsync(request);

        // Assert
        var createdResult = result.Result.ShouldBeOfType<CreatedAtActionResult>();
        var profile = createdResult.Value.ShouldBeOfType<ResumeProfile>();
        profile.Name.ShouldBe("Bob");
        profile.Title.ShouldBe("Designer");
        profile.IsActive.ShouldBeFalse();

        await _serviceMock.Received(1).CreateProfileAsync(Arg.Any<ResumeProfile>());
    }
}
