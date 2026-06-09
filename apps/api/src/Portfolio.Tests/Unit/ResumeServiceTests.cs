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
        await _repositoryMock.Received(2).SaveChangesAsync();
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

    [Fact]
    public async Task ListProfilesAsync_ReturnsProfiles()
    {
        var profiles = new List<ResumeProfile> { new() { Id = Guid.NewGuid() } };
        _repositoryMock.ListProfilesAsync().Returns(profiles);

        var result = await _service.ListProfilesAsync();

        result.ShouldBe(profiles);
        await _repositoryMock.Received(1).ListProfilesAsync();
    }

    [Fact]
    public async Task CreateProfileAsync_AddsAndSaves()
    {
        var profile = new ResumeProfile { Id = Guid.NewGuid() };

        var result = await _service.CreateProfileAsync(profile);

        result.ShouldBe(profile);
        await _repositoryMock.Received(1).AddProfileAsync(profile);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task UpdateProfileAsync_UpdatesAndSaves()
    {
        var profile = new ResumeProfile { Id = Guid.NewGuid() };

        await _service.UpdateProfileAsync(profile);

        await _repositoryMock.Received(1).UpdateProfileAsync(profile);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task DeleteProfileAsync_DeletesAndSaves()
    {
        var id = Guid.NewGuid();

        await _service.DeleteProfileAsync(id);

        await _repositoryMock.Received(1).DeleteProfileAsync(id);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task ListSkillsAsync_ReturnsSkills()
    {
        var skills = new List<SkillCategory> { new() { Id = Guid.NewGuid(), CategoryName = "Category" } };
        _repositoryMock.ListSkillsAsync().Returns(skills);

        var result = await _service.ListSkillsAsync();

        result.ShouldBe(skills);
        await _repositoryMock.Received(1).ListSkillsAsync();
    }

    [Fact]
    public async Task CreateSkillCategoryAsync_AddsAndSaves()
    {
        var category = new SkillCategory { Id = Guid.NewGuid(), CategoryName = "Cat" };

        var result = await _service.CreateSkillCategoryAsync(category);

        result.ShouldBe(category);
        await _repositoryMock.Received(1).AddSkillCategoryAsync(category);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task UpdateSkillCategoryAsync_UpdatesAndSaves()
    {
        var category = new SkillCategory { Id = Guid.NewGuid(), CategoryName = "Cat" };

        await _service.UpdateSkillCategoryAsync(category);

        await _repositoryMock.Received(1).UpdateSkillCategoryAsync(category);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task DeleteSkillCategoryAsync_DeletesAndSaves()
    {
        var id = Guid.NewGuid();

        await _service.DeleteSkillCategoryAsync(id);

        await _repositoryMock.Received(1).DeleteSkillCategoryAsync(id);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task CreateSkillAsync_AddsAndSaves()
    {
        var skill = new Skill { Id = Guid.NewGuid(), SkillName = "Skill" };

        var result = await _service.CreateSkillAsync(skill);

        result.ShouldBe(skill);
        await _repositoryMock.Received(1).AddSkillAsync(skill);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task UpdateSkillAsync_UpdatesAndSaves()
    {
        var skill = new Skill { Id = Guid.NewGuid(), SkillName = "Skill" };

        await _service.UpdateSkillAsync(skill);

        await _repositoryMock.Received(1).UpdateSkillAsync(skill);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task DeleteSkillAsync_DeletesAndSaves()
    {
        var id = Guid.NewGuid();

        await _service.DeleteSkillAsync(id);

        await _repositoryMock.Received(1).DeleteSkillAsync(id);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }
}
