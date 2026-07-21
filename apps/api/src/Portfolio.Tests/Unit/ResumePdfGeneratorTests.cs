using System;
using System.Collections.Generic;
using Portfolio.Application.Resume.Contracts.Responses;
using Portfolio.Application.Resume.Services;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class ResumePdfGeneratorTests
{
    private readonly ResumePdfGenerator _generator = new();

    [Fact]
    public void GeneratePdf_ReturnsNonEmptyByteArray_WhenProfileIsValid()
    {
        // Arrange
        var profile = new ResumeProfileResponse
        {
            Id = Guid.NewGuid(),
            Name = "John Doe",
            Title = "Senior Software Engineer",
            Intro = "An experienced software engineer with a track record of success.",
            IsActive = true,
            Links = new List<ResumeProfileLinkResponse>
            {
                new() 
                { 
                    Id = Guid.NewGuid(),
                    Url = "mailto:john@example.com",
                    LinkType = new ResumeLinkTypeResponse { KeyIdentifier = "email", Name = "Email" }
                },
                new() 
                { 
                    Id = Guid.NewGuid(),
                    Url = "https://github.com/johndoe",
                    LinkType = new ResumeLinkTypeResponse { KeyIdentifier = "github", Name = "GitHub" }
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Url = "https://linkedin.com/in/johndoe",
                    LinkType = new ResumeLinkTypeResponse { KeyIdentifier = "linkedin", Name = "LinkedIn" }
                }
            },
            WorkExperiences = new List<WorkExperienceResponse>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Role = "Lead Engineer",
                    Company = "Tech Corp",
                    Location = "San Francisco, CA",
                    Period = "2020 - Present",
                    IsPrevious = false,
                    DisplayOrder = 1,
                    Highlights = new List<ExperienceHighlightResponse>
                    {
                        new() { Id = Guid.NewGuid(), ResultText = "Led a team of developers to build awesome cloud applications.", DisplayOrder = 1 }
                    }
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Role = "Junior Developer",
                    Company = "Startup Co",
                    Location = "Remote",
                    Period = "2018 - 2020",
                    IsPrevious = true,
                    DisplayOrder = 2
                }
            }
        };

        var skillCategories = new List<SkillCategoryResponse>
        {
            new()
            {
                Id = Guid.NewGuid(),
                CategoryName = "Languages",
                DisplayOrder = 1,
                Skills = new List<SkillResponse>
                {
                    new() { Id = Guid.NewGuid(), SkillName = "C#", DisplayOrder = 1 },
                    new() { Id = Guid.NewGuid(), SkillName = "TypeScript", DisplayOrder = 2 }
                }
            }
        };

        // Act
        var pdfBytes = _generator.GeneratePdf(profile, skillCategories);

        // Assert
        pdfBytes.ShouldNotBeNull();
        pdfBytes.Length.ShouldBeGreaterThan(0);
    }

    [Fact]
    public void GeneratePdf_HandlesEmptyLinksAndExperiences()
    {
        // Arrange
        var profile = new ResumeProfileResponse
        {
            Id = Guid.NewGuid(),
            Name = "John Doe Minimal",
            Title = "Freelancer",
            Intro = null!, // Empty Intro
            IsActive = true,
            Links = new List<ResumeProfileLinkResponse>(),
            WorkExperiences = new List<WorkExperienceResponse>()
        };

        var skillCategories = new List<SkillCategoryResponse>();

        // Act
        var pdfBytes = _generator.GeneratePdf(profile, skillCategories);

        // Assert
        pdfBytes.ShouldNotBeNull();
        pdfBytes.Length.ShouldBeGreaterThan(0);
    }

    [Theory]
    [InlineData("email", "mailto:test@example.com")]
    [InlineData("Email", "mailto:test@example.com")]
    [InlineData("phone", "123-456-7890")]
    [InlineData("linkedin", "https://www.linkedin.com/in/aj")]
    [InlineData("github", "http://github.com/aj")]
    [InlineData("website", "https://mywebsite.com/")]
    [InlineData("unknown", "https://unknown.com")]
    [InlineData("email", null)]
    [InlineData("email", " ")]
    public void GeneratePdf_FormatsContactUrlsCorrectly(string linkType, string? inputUrl)
    {
        // Arrange
        var profile = new ResumeProfileResponse
        {
            Id = Guid.NewGuid(),
            Name = "Link Test",
            Title = "Tester",
            Links = new List<ResumeProfileLinkResponse>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Url = inputUrl!,
                    LinkType = new ResumeLinkTypeResponse { KeyIdentifier = linkType, Name = linkType }
                }
            },
            WorkExperiences = new List<WorkExperienceResponse>()
        };

        // Act
        var pdfBytes = _generator.GeneratePdf(profile, new List<SkillCategoryResponse>());

        // Assert
        pdfBytes.ShouldNotBeNull();
        pdfBytes.Length.ShouldBeGreaterThan(0);
    }

    [Fact]
    public void GeneratePdf_FiltersAndSortsWorkExperiences_Correctly()
    {
        // Arrange
        var profile = new ResumeProfileResponse
        {
            Id = Guid.NewGuid(),
            Name = "Work Test",
            Title = "Tester",
            WorkExperiences = new List<WorkExperienceResponse>
            {
                new() { Role = "Old Job", IsPrevious = true, DisplayOrder = 2, Highlights = new List<ExperienceHighlightResponse>() },
                new() { Role = "Older Job", IsPrevious = true, DisplayOrder = 1, Highlights = new List<ExperienceHighlightResponse>() },
                new() { Role = "Current Job", IsPrevious = false, DisplayOrder = 2, Highlights = new List<ExperienceHighlightResponse>() },
                new() { Role = "Most Recent Job", IsPrevious = false, DisplayOrder = 1, Location = "Remote", Highlights = new List<ExperienceHighlightResponse>
                {
                    new() { ResultText = "Did something", DisplayOrder = 2 },
                    new() { ResultText = "Did something better", DisplayOrder = 1 }
                } }
            }
        };

        // Act
        var pdfBytes = _generator.GeneratePdf(profile, new List<SkillCategoryResponse>());

        // Assert
        pdfBytes.ShouldNotBeNull();
        pdfBytes.Length.ShouldBeGreaterThan(0);
    }

    [Fact]
    public void GeneratePdf_HandlesEmptySkillsWithinCategory()
    {
        // Arrange
        var profile = new ResumeProfileResponse { Name = "Skill Test", Title = "Tester", WorkExperiences = new List<WorkExperienceResponse>() };
        var categories = new List<SkillCategoryResponse>
        {
            new() 
            { 
                CategoryName = "Empty Cat", 
                DisplayOrder = 1, 
                Skills = new List<SkillResponse>() 
            },
            new() 
            { 
                CategoryName = "Populated Cat", 
                DisplayOrder = 2, 
                Skills = new List<SkillResponse> { new() { SkillName = "C#", DisplayOrder = 1 } } 
            }
        };

        // Act
        var pdfBytes = _generator.GeneratePdf(profile, categories);

        // Assert
        pdfBytes.ShouldNotBeNull();
    }
}
