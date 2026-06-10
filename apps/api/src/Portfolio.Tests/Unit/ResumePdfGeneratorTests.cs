using System;
using System.Collections.Generic;
using Portfolio.Application.Resume.Services;
using Portfolio.Domain.Resume;
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
        var profile = new ResumeProfile
        {
            Id = Guid.NewGuid(),
            Name = "John Doe",
            Title = "Senior Software Engineer",
            Intro = "An experienced software engineer with a track record of success.",
            IsActive = true,
            Links = new List<ResumeProfileLink>
            {
                new() 
                { 
                    Id = Guid.NewGuid(),
                    Url = "mailto:john@example.com",
                    LinkType = new ResumeProfileLinkType { KeyIdentifier = "email", Name = "Email" }
                },
                new() 
                { 
                    Id = Guid.NewGuid(),
                    Url = "https://github.com/johndoe",
                    LinkType = new ResumeProfileLinkType { KeyIdentifier = "github", Name = "GitHub" }
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Url = "https://linkedin.com/in/johndoe",
                    LinkType = new ResumeProfileLinkType { KeyIdentifier = "linkedin", Name = "LinkedIn" }
                }
            },
            WorkExperiences = new List<WorkExperience>
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
                    Highlights = new List<ExperienceHighlight>
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

        var skillCategories = new List<SkillCategory>
        {
            new()
            {
                Id = Guid.NewGuid(),
                CategoryName = "Languages",
                DisplayOrder = 1,
                Skills = new List<Skill>
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
        var profile = new ResumeProfile
        {
            Id = Guid.NewGuid(),
            Name = "John Doe Minimal",
            Title = "Freelancer",
            Intro = null, // Empty Intro
            IsActive = true,
            Links = new List<ResumeProfileLink>(),
            WorkExperiences = new List<WorkExperience>()
        };

        var skillCategories = new List<SkillCategory>();

        // Act
        var pdfBytes = _generator.GeneratePdf(profile, skillCategories);

        // Assert
        pdfBytes.ShouldNotBeNull();
        pdfBytes.Length.ShouldBeGreaterThan(0);
    }
}
