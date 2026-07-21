using NSubstitute;
using Portfolio.Application.Resume.Contracts.Requests;
using Portfolio.Application.Resume.Contracts.Responses;
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
    public async Task GetActiveProfileAsync_ReturnsActiveProfileResponse()
    {
        // Arrange
        var profile = new ResumeProfile { Id = Guid.NewGuid(), Name = "AJ", IsActive = true, Title = "Dev", Intro = "Intro" };
        _repositoryMock.GetActiveProfileAsync().Returns(profile);

        // Act
        var result = await _service.GetActiveProfileAsync();

        // Assert
        result.ShouldNotBeNull();
        result.IsActive.ShouldBeTrue();
        result.Name.ShouldBe("AJ");
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
    public async Task ActivateProfileAsync_ThrowsNotFoundException_WhenProfileDoesNotExist()
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
    public async Task ListProfilesAsync_ReturnsAllProfilesAsResponses()
    {
        // Arrange
        var profiles = new List<ResumeProfile>
        {
            new ResumeProfile { Id = Guid.NewGuid(), Name = "P1" },
            new ResumeProfile { Id = Guid.NewGuid(), Name = "P2" }
        };
        _repositoryMock.ListProfilesAsync().Returns(profiles);

        // Act
        var result = await _service.ListProfilesAsync();

        // Assert
        result.Count.ShouldBe(2);
        result[0].Name.ShouldBe("P1");
        result[1].Name.ShouldBe("P2");
    }

    [Fact]
    public async Task CreateProfileAsync_CallsCreateProfileWithDetailsAsync()
    {
        // Arrange
        var request = new CreateResumeRequest { Name = "New Profile" };

        // Act
        var result = await _service.CreateProfileAsync(request);

        // Assert
        result.ShouldNotBeNull();
        result.Name.ShouldBe("New Profile");
        await _repositoryMock.Received(1).AddProfileAsync(Arg.Is<ResumeProfile>(p => p.Name == "New Profile"));
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task UpdateProfileAsync_CallsUpdateProfileWithDetailsAsync()
    {
        // Arrange
        var id = Guid.NewGuid();
        var existingProfile = new ResumeProfile { Id = id, Name = "Old Name" };
        _repositoryMock.GetProfileByIdAsync(id).Returns(existingProfile);

        var request = new UpdateResumeRequest { Name = "Updated Name" };

        // Act
        await _service.UpdateProfileAsync(id, request);

        // Assert
        await _repositoryMock.Received(1).UpdateProfileAsync(Arg.Is<ResumeProfile>(p => p.Name == "Updated Name"));
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task DeleteProfileAsync_CallsRepositoryDeleteAndSave()
    {
        // Arrange
        var id = Guid.NewGuid();

        // Act
        await _service.DeleteProfileAsync(id);

        // Assert
        await _repositoryMock.Received(1).DeleteProfileAsync(id);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task ListSkillsAsync_ReturnsSkillsFromRepositoryAsResponses()
    {
        // Arrange
        var skills = new List<SkillCategory> { new SkillCategory { Id = Guid.NewGuid(), CategoryName = "Cat1" } };
        _repositoryMock.ListSkillsAsync().Returns(skills);

        // Act
        var result = await _service.ListSkillsAsync();

        // Assert
        result.Count.ShouldBe(1);
        result[0].CategoryName.ShouldBe("Cat1");
    }

    [Fact]
    public async Task CreateSkillCategoryAsync_CallsRepositoryAndSave()
    {
        // Arrange
        var request = new CreateSkillCategoryRequest { CategoryName = "New Cat" };

        // Act
        var result = await _service.CreateSkillCategoryAsync(request);

        // Assert
        result.ShouldNotBeNull();
        result.CategoryName.ShouldBe("New Cat");
        await _repositoryMock.Received(1).AddSkillCategoryAsync(Arg.Is<SkillCategory>(c => c.CategoryName == "New Cat"));
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task UpdateSkillCategoryAsync_CallsRepositoryAndSave()
    {
        // Arrange
        var id = Guid.NewGuid();
        var request = new UpdateSkillCategoryRequest { CategoryName = "Updated Cat" };

        // Act
        await _service.UpdateSkillCategoryAsync(id, request);

        // Assert
        await _repositoryMock.Received(1).UpdateSkillCategoryAsync(Arg.Is<SkillCategory>(c => c.Id == id && c.CategoryName == "Updated Cat"));
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task DeleteSkillCategoryAsync_CallsRepositoryAndSave()
    {
        // Arrange
        var id = Guid.NewGuid();

        // Act
        await _service.DeleteSkillCategoryAsync(id);

        // Assert
        await _repositoryMock.Received(1).DeleteSkillCategoryAsync(id);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task CreateSkillAsync_CallsRepositoryAndSave()
    {
        // Arrange
        var request = new CreateSkillRequest { CategoryId = Guid.NewGuid(), SkillName = "C#" };

        // Act
        var result = await _service.CreateSkillAsync(request);

        // Assert
        result.ShouldNotBeNull();
        result.SkillName.ShouldBe("C#");
        await _repositoryMock.Received(1).AddSkillAsync(Arg.Is<Skill>(s => s.SkillName == "C#"));
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task UpdateSkillAsync_CallsRepositoryAndSave()
    {
        // Arrange
        var id = Guid.NewGuid();
        var request = new UpdateSkillRequest { CategoryId = Guid.NewGuid(), SkillName = "C# Updated" };

        // Act
        await _service.UpdateSkillAsync(id, request);

        // Assert
        await _repositoryMock.Received(1).UpdateSkillAsync(Arg.Is<Skill>(s => s.Id == id && s.SkillName == "C# Updated"));
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task DeleteSkillAsync_CallsRepositoryAndSave()
    {
        // Arrange
        var id = Guid.NewGuid();

        // Act
        await _service.DeleteSkillAsync(id);

        // Assert
        await _repositoryMock.Received(1).DeleteSkillAsync(id);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task CreateProfileWithDetailsAsync_CreatesProfileAndDetails_Successfully()
    {
        // Arrange
        var request = new CreateResumeRequest
        {
            Name = "John Doe",
            Title = "Software Engineer",
            Intro = "Test Intro",
            PhotoUrlLight = "http://light.png",
            PhotoUrlDark = "http://dark.png",
            Links = new List<ResumeLinkRequest>
            {
                new ResumeLinkRequest { LinkTypeName = "GitHub", LinkTypeKey = "github", Url = "https://github.com/test", DisplayInHeader = true }
            },
            WorkExperiences = new List<WorkExperienceRequest>
            {
                new WorkExperienceRequest
                {
                    Company = "Test Co",
                    Role = "Engineer",
                    Period = "2020 - Present",
                    Location = "Remote",
                    IsPrevious = false,
                    DisplayOrder = 1,
                    Highlights = new List<string> { "Highlight 1" },
                    SkillIds = new List<Guid> { Guid.NewGuid() }
                }
            }
        };

        _repositoryMock.GetLinkTypeByKeyAsync("github").Returns((ResumeProfileLinkType?)null);

        // Act
        var result = await _service.CreateProfileWithDetailsAsync(request);

        // Assert
        result.ShouldNotBeNull();
        result.Name.ShouldBe("John Doe");
        result.Title.ShouldBe("Software Engineer");
        result.Intro.ShouldBe("Test Intro");

        await _repositoryMock.Received(1).AddProfileAsync(Arg.Is<ResumeProfile>(p => p.Name == "John Doe"));
        await _repositoryMock.Received(1).AddProfileLinkTypeAsync(Arg.Is<ResumeProfileLinkType>(lt => lt.KeyIdentifier == "github"));
        await _repositoryMock.Received(1).AddProfileLinkAsync(Arg.Any<ResumeProfileLink>());
        await _repositoryMock.Received(1).AddWorkExperienceAsync(Arg.Is<WorkExperience>(w => w.Company == "Test Co"));
        await _repositoryMock.Received(1).AddExperienceHighlightAsync(Arg.Is<ExperienceHighlight>(h => h.ResultText == "Highlight 1"));
        await _repositoryMock.Received(1).AddWorkExperienceSkillAsync(Arg.Any<WorkExperienceSkill>());
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task UpdateProfileWithDetailsAsync_UpdatesExistingProfile_Successfully()
    {
        // Arrange
        var id = Guid.NewGuid();
        var existingProfile = new ResumeProfile { Id = id, Name = "Old Name" };
        _repositoryMock.GetProfileByIdAsync(id).Returns(existingProfile);

        var request = new UpdateResumeRequest
        {
            Name = "New Name",
            Title = "New Title",
            Intro = "New Intro",
            Links = new List<ResumeLinkRequest>
            {
                new ResumeLinkRequest { LinkTypeName = "LinkedIn", LinkTypeKey = "linkedin", Url = "https://linkedin.com/in/test" }
            },
            WorkExperiences = new List<WorkExperienceRequest>()
        };

        _repositoryMock.GetLinkTypeByKeyAsync("linkedin").Returns(new ResumeProfileLinkType { Id = Guid.NewGuid(), KeyIdentifier = "linkedin" });

        // Act
        await _service.UpdateProfileWithDetailsAsync(id, request);

        // Assert
        await _repositoryMock.Received(1).UpdateProfileAsync(Arg.Is<ResumeProfile>(p => p.Name == "New Name"));
        await _repositoryMock.Received(1).RemoveLinksByProfileIdAsync(id);
        await _repositoryMock.Received(1).AddProfileLinkAsync(Arg.Any<ResumeProfileLink>());
        await _repositoryMock.Received(1).RemoveWorkExperiencesByProfileIdAsync(id);
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

    [Fact]
    public async Task GetProfileByIdAsync_ReturnsProfileFromRepositoryAsResponse()
    {
        // Arrange
        var id = Guid.NewGuid();
        var profile = new ResumeProfile { Id = id, Name = "Test" };
        _repositoryMock.GetProfileByIdAsync(id).Returns(profile);

        // Act
        var result = await _service.GetProfileByIdAsync(id);

        // Assert
        result.ShouldNotBeNull();
        result.Id.ShouldBe(id);
        result.Name.ShouldBe("Test");
        await _repositoryMock.Received(1).GetProfileByIdAsync(id);
    }

    [Fact]
    public async Task CreateProfileWithDetailsAsync_UsesDefaultPhotos_WhenNull()
    {
        // Arrange
        var request = new CreateResumeRequest
        {
            Name = "John Doe",
            PhotoUrlLight = null,
            PhotoUrlDark = null
        };

        // Act
        var result = await _service.CreateProfileWithDetailsAsync(request);

        // Assert
        await _repositoryMock.Received(1).AddProfileAsync(Arg.Is<ResumeProfile>(p => 
            p.PhotoUrlLight.Contains("unsplash") && p.PhotoUrlDark.Contains("unsplash")));
    }

    [Fact]
    public async Task MapToResponse_StripsCyclicReferences()
    {
        // Arrange
        var profileId = Guid.NewGuid();
        var expId = Guid.NewGuid();
        var skillId = Guid.NewGuid();

        var profile = new ResumeProfile
        {
            Id = profileId,
            Name = "Test Developer"
        };

        var exp = new WorkExperience
        {
            Id = expId,
            ProfileId = profileId,
            Profile = profile,
            Company = "Tech Corp"
        };

        var highlight = new ExperienceHighlight
        {
            Id = Guid.NewGuid(),
            ExperienceId = expId,
            Experience = exp,
            ResultText = "Did cool stuff"
        };

        var skill = new Skill
        {
            Id = skillId,
            SkillName = "C#"
        };

        var wes = new WorkExperienceSkill
        {
            WorkExperienceId = expId,
            WorkExperience = exp,
            SkillId = skillId,
            Skill = skill
        };

        exp.Highlights.Add(highlight);
        exp.WorkExperienceSkills.Add(wes);
        profile.WorkExperiences.Add(exp);

        // Act
        var response = ResumeService.MapToResponse(profile);

        // Assert
        response.ShouldNotBeNull();
        response.WorkExperiences.Count.ShouldBe(1);
        response.WorkExperiences[0].Highlights.Count.ShouldBe(1);
        response.WorkExperiences[0].Highlights[0].ResultText.ShouldBe("Did cool stuff");
        response.WorkExperiences[0].WorkExperienceSkills.Count.ShouldBe(1);
        response.WorkExperiences[0].WorkExperienceSkills[0].Skill!.SkillName.ShouldBe("C#");
    }
}
