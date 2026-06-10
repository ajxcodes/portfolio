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

    [Fact]
    public async Task CreateProfileWithDetailsAsync_CreatesFullyPopulatedProfile()
    {
        // Arrange
        var request = new CreateResumeRequest
        {
            Name = "John Doe",
            Title = "Software Engineer",
            Intro = "Hello world",
            PhotoUrlLight = "light.jpg",
            PhotoUrlDark = "dark.jpg",
            Links = new List<ResumeLinkDto>
            {
                new() { LinkTypeName = "GitHub", LinkTypeKey = "github", Url = "https://github.com" },
                new() { LinkTypeName = "LinkedIn", LinkTypeKey = "linkedin", Url = "https://linkedin.com" }
            },
            WorkExperiences = new List<WorkExperienceDto>
            {
                new()
                {
                    Company = "Google",
                    Role = "SWE",
                    Period = "2020-Present",
                    Location = "Mountain View",
                    IsPrevious = false,
                    DisplayOrder = 1,
                    Highlights = new List<string> { "Did code", "Did more code" },
                    SkillIds = new List<Guid> { Guid.NewGuid() }
                }
            }
        };

        var existingLinkType = new ResumeProfileLinkType { Id = Guid.NewGuid(), KeyIdentifier = "github", Name = "GitHub" };
        _repositoryMock.GetLinkTypeByKeyAsync("github").Returns(existingLinkType);
        _repositoryMock.GetLinkTypeByKeyAsync("linkedin").Returns((ResumeProfileLinkType?)null);

        // Act
        var result = await _service.CreateProfileWithDetailsAsync(request);

        // Assert
        result.Name.ShouldBe("John Doe");
        result.Title.ShouldBe("Software Engineer");
        result.Intro.ShouldBe("Hello world");
        result.PhotoUrlLight.ShouldBe("light.jpg");
        result.PhotoUrlDark.ShouldBe("dark.jpg");

        await _repositoryMock.Received(1).AddProfileAsync(Arg.Any<ResumeProfile>());
        await _repositoryMock.Received(2).AddProfileLinkAsync(Arg.Any<ResumeProfileLink>());
        await _repositoryMock.Received(1).AddProfileLinkTypeAsync(Arg.Is<ResumeProfileLinkType>(lt => lt.KeyIdentifier == "linkedin"));
        await _repositoryMock.Received(1).AddWorkExperienceAsync(Arg.Any<WorkExperience>());
        await _repositoryMock.Received(2).AddExperienceHighlightAsync(Arg.Any<ExperienceHighlight>());
        await _repositoryMock.Received(1).AddWorkExperienceSkillAsync(Arg.Any<WorkExperienceSkill>());
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task UpdateProfileWithDetailsAsync_UpdatesFullyPopulatedProfile()
    {
        // Arrange
        var profileId = Guid.NewGuid();
        var profile = new ResumeProfile { Id = profileId, Name = "Old Name" };
        _repositoryMock.GetProfileByIdAsync(profileId).Returns(profile);

        var request = new UpdateResumeRequest
        {
            Name = "New Name",
            Title = "Senior SWE",
            Intro = "New Intro",
            PhotoUrlLight = "new-light.jpg",
            PhotoUrlDark = "new-dark.jpg",
            Links = new List<ResumeLinkDto>
            {
                new() { LinkTypeName = "GitHub", LinkTypeKey = "github", Url = "https://github.com/new" }
            },
            WorkExperiences = new List<WorkExperienceDto>
            {
                new()
                {
                    Company = "Meta",
                    Role = "Senior SWE",
                    Period = "2024",
                    Location = "Remote",
                    IsPrevious = true,
                    DisplayOrder = 2,
                    Highlights = new List<string> { "Led team" },
                    SkillIds = new List<Guid> { Guid.NewGuid() }
                }
            }
        };

        _repositoryMock.GetLinkTypeByKeyAsync("github").Returns((ResumeProfileLinkType?)null);

        // Act
        await _service.UpdateProfileWithDetailsAsync(profileId, request);

        // Assert
        profile.Name.ShouldBe("New Name");
        profile.Title.ShouldBe("Senior SWE");
        profile.Intro.ShouldBe("New Intro");
        profile.PhotoUrlLight.ShouldBe("new-light.jpg");
        profile.PhotoUrlDark.ShouldBe("new-dark.jpg");

        await _repositoryMock.Received(1).RemoveLinksByProfileIdAsync(profileId);
        await _repositoryMock.Received(1).RemoveWorkExperiencesByProfileIdAsync(profileId);
        await _repositoryMock.Received(1).AddProfileLinkTypeAsync(Arg.Any<ResumeProfileLinkType>());
        await _repositoryMock.Received(1).AddProfileLinkAsync(Arg.Any<ResumeProfileLink>());
        await _repositoryMock.Received(1).AddWorkExperienceAsync(Arg.Any<WorkExperience>());
        await _repositoryMock.Received(1).AddExperienceHighlightAsync(Arg.Any<ExperienceHighlight>());
        await _repositoryMock.Received(1).AddWorkExperienceSkillAsync(Arg.Any<WorkExperienceSkill>());
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task UpdateProfileWithDetailsAsync_ThrowsKeyNotFoundException_WhenProfileDoesNotExist()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repositoryMock.GetProfileByIdAsync(id).Returns((ResumeProfile?)null);

        // Act & Assert
        await Should.ThrowAsync<KeyNotFoundException>(async () =>
        {
            await _service.UpdateProfileWithDetailsAsync(id, new UpdateResumeRequest());
        });
    }
}
