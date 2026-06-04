using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NSubstitute;
using Portfolio.Application.Resume.Repositories;
using Portfolio.Application.Resume.Services;
using Portfolio.Domain.Resume;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class ResumeServiceTests
{
    private readonly IResumeRepository _repositoryMock = Substitute.For<IResumeRepository>();
    private readonly ResumeService _service;

    public ResumeServiceTests()
    {
        _service = new ResumeService(_repositoryMock);
    }

    [Fact]
    public async Task GetActiveProfileAsync_ReturnsActiveProfile()
    {
        // Arrange
        var profile = new ResumeProfile { Id = Guid.NewGuid(), Name = "AJ", IsActive = true, Title = "Dev", Intro = "Intro" };
        _repositoryMock.GetActiveProfileAsync().Returns(profile);

        // Act
        var result = await _service.GetActiveProfileAsync();

        // Assert
        result.ShouldNotBeNull();
        result.IsActive.ShouldBeTrue();
    }

    [Fact]
    public async Task ActivateProfileAsync_TogglesProfilesCorrectly()
    {
        // Arrange
        var targetId = Guid.NewGuid();
        var p1 = new ResumeProfile { Id = targetId, Name = "Target", IsActive = false, Title = "Dev", Intro = "Intro" };
        var p2 = new ResumeProfile { Id = Guid.NewGuid(), Name = "Other", IsActive = true, Title = "Dev", Intro = "Intro" };
        
        _repositoryMock.GetProfileByIdAsync(targetId).Returns(p1);
        _repositoryMock.ListProfilesAsync().Returns(new List<ResumeProfile> { p1, p2 });

        // Act
        await _service.ActivateProfileAsync(targetId);

        // Assert
        p1.IsActive.ShouldBeTrue();
        p2.IsActive.ShouldBeFalse();

        await _repositoryMock.Received(1).UpdateProfileAsync(p1);
        await _repositoryMock.Received(1).UpdateProfileAsync(p2);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task ActivateProfileAsync_ThrowsKeyNotFoundException_WhenProfileDoesNotExist()
    {
        // Arrange
        var targetId = Guid.NewGuid();
        _repositoryMock.GetProfileByIdAsync(targetId).Returns((ResumeProfile?)null);

        // Act & Assert
        await Should.ThrowAsync<KeyNotFoundException>(async () =>
        {
            await _service.ActivateProfileAsync(targetId);
        });
    }
}
