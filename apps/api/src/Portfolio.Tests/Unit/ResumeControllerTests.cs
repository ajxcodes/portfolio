using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using Portfolio.Api.Resume.Controllers;
using Portfolio.Application.Resume.Services;
using Portfolio.Application.Storage.Services;
using Portfolio.Domain.Resume;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class ResumeControllerTests
{
    private readonly IResumeService _serviceMock = Substitute.For<IResumeService>();
    private readonly IStorageService _storageServiceMock = Substitute.For<IStorageService>();
    private readonly IResumePdfGenerator _pdfGeneratorMock = Substitute.For<IResumePdfGenerator>();
    private readonly ResumeController _controller;

    public ResumeControllerTests()
    {
        _controller = new ResumeController(_serviceMock, _storageServiceMock, _pdfGeneratorMock);
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
    public async Task GetById_ReturnsProfile_WhenExists()
    {
        // Arrange
        var profileId = Guid.NewGuid();
        var profile = new ResumeProfile { Id = profileId, Name = "Alice", Title = "Architect", Intro = "Intro" };
        _serviceMock.GetProfileByIdAsync(profileId).Returns(profile);

        // Act
        var result = await _controller.GetById(profileId);

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

    [Fact]
    public async Task PrepareDownloadAsync_Returns500_WhenServicesNotConfigured()
    {
        var controllerWithoutServices = new ResumeController(_serviceMock, null, null);
        var result = await controllerWithoutServices.PrepareDownloadAsync();
        var statusResult = result.ShouldBeOfType<ObjectResult>();
        statusResult.StatusCode.ShouldBe(500);
    }

    [Fact]
    public async Task PrepareDownloadAsync_Returns404_WhenNoActiveProfile()
    {
        _serviceMock.GetActiveProfileAsync().Returns((ResumeProfile?)null);
        var result = await _controller.PrepareDownloadAsync();
        result.ShouldBeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task PrepareDownloadAsync_ReturnsOkWithUrl_WhenCacheHit()
    {
        var activeProfile = new ResumeProfile { Id = Guid.NewGuid(), UpdatedAt = DateTime.UtcNow };
        _serviceMock.GetActiveProfileAsync().Returns(activeProfile);
        _storageServiceMock.GetFileUrlIfExistsAsync(Arg.Any<string>()).Returns("http://cached-url.pdf");

        var result = await _controller.PrepareDownloadAsync();

        var okResult = result.ShouldBeOfType<OkObjectResult>();
        okResult.Value.ShouldNotBeNull();
        var downloadUrlProp = okResult.Value.GetType().GetProperty("DownloadUrl");
        downloadUrlProp.ShouldNotBeNull();
        downloadUrlProp.GetValue(okResult.Value).ShouldBe("http://cached-url.pdf");
    }

    [Fact]
    public async Task PrepareDownloadAsync_GeneratesAndUploads_WhenCacheMiss()
    {
        var activeProfile = new ResumeProfile { Id = Guid.NewGuid(), UpdatedAt = DateTime.UtcNow };
        var skillCategories = new List<SkillCategory>();
        _serviceMock.GetActiveProfileAsync().Returns(activeProfile);
        _serviceMock.ListSkillsAsync().Returns(skillCategories);
        _storageServiceMock.GetFileUrlIfExistsAsync(Arg.Any<string>()).Returns((string?)null);
        
        var pdfBytes = new byte[] { 1, 2, 3 };
        _pdfGeneratorMock.GeneratePdf(activeProfile, skillCategories).Returns(pdfBytes);
        _storageServiceMock.UploadFileAsync(Arg.Any<Stream>(), "resume.pdf", "application/pdf", Arg.Any<string>())
            .Returns("http://uploaded-url.pdf");

        var result = await _controller.PrepareDownloadAsync();

        var okResult = result.ShouldBeOfType<OkObjectResult>();
        okResult.Value.ShouldNotBeNull();
        var downloadUrlProp = okResult.Value.GetType().GetProperty("DownloadUrl");
        downloadUrlProp.ShouldNotBeNull();
        downloadUrlProp.GetValue(okResult.Value).ShouldBe("http://uploaded-url.pdf");
    }
}
