using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Portfolio.Application.AI.Constants;
using Portfolio.Application.AI.Services;
using Portfolio.Application.Resume.Services;
using Portfolio.Domain.Resume;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit.Application.AI;

public class AiPromptServiceTests
{
    private readonly IResumeService _resumeServiceMock = Substitute.For<IResumeService>();
    private readonly AiPromptService _service;

    public AiPromptServiceTests()
    {
        _service = new AiPromptService(_resumeServiceMock);
    }

    [Fact]
    public async Task BuildResumeSystemPromptAsync_WithActiveProfile_ReturnsFormattedPrompt()
    {
        // Arrange
        var profile = new ResumeProfile
        {
            Name = "John Doe",
            Title = "Dev",
            Intro = "Hello",
            Links = new System.Collections.Generic.List<ResumeProfileLink>
            {
                new ResumeProfileLink { Url = "https://github.com", LinkType = new ResumeProfileLinkType { Name = "GitHub" } },
                new ResumeProfileLink { Url = "https://nolinktype.com", LinkType = null }
            },
            WorkExperiences = new System.Collections.Generic.List<WorkExperience>
            {
                new WorkExperience 
                { 
                    Role = "Job 2", 
                    Company = "Comp", 
                    Period = "Later", 
                    DisplayOrder = 2,
                    Highlights = new System.Collections.Generic.List<ExperienceHighlight>
                    {
                        new ExperienceHighlight { ResultText = "Did second thing", DisplayOrder = 2 },
                        new ExperienceHighlight { ResultText = "Did first thing", DisplayOrder = 1 }
                    }
                },
                new WorkExperience 
                { 
                    Role = "Job 1", 
                    Company = "Comp", 
                    Period = "Now", 
                    DisplayOrder = 1,
                    Highlights = new System.Collections.Generic.List<ExperienceHighlight>()
                }
            }
        };
        _resumeServiceMock.GetActiveProfileAsync().Returns(profile);

        var skills = new System.Collections.Generic.List<SkillCategory>
        {
            new SkillCategory 
            { 
                CategoryName = "Languages",
                Skills = new System.Collections.Generic.List<Skill>
                {
                    new Skill { SkillName = "C#" },
                    new Skill { SkillName = "TypeScript" }
                }
            }
        };
        _resumeServiceMock.ListSkillsAsync().Returns(skills);

        // Act
        var prompt = await _service.BuildResumeSystemPromptAsync();

        // Assert
        prompt.ShouldContain("John Doe");
        prompt.ShouldContain("Title: Dev");
        prompt.ShouldContain("Intro: Hello");
        
        // Assert Ordering
        var indexJob1 = prompt.IndexOf("Job 1 at Comp (Now)");
        var indexJob2 = prompt.IndexOf("Job 2 at Comp (Later)");
        indexJob1.ShouldBeLessThan(indexJob2);

        var indexHighlight1 = prompt.IndexOf("Did first thing");
        var indexHighlight2 = prompt.IndexOf("Did second thing");
        indexHighlight1.ShouldBeLessThan(indexHighlight2);

        prompt.ShouldContain("Work Experience:");
        prompt.ShouldContain("Profile Links:");
        prompt.ShouldContain("GitHub: https://github.com");
        prompt.ShouldContain("Link: https://nolinktype.com");

        prompt.ShouldContain("Skills & Technologies:");
        prompt.ShouldContain("Languages: C#, TypeScript");
    }

    [Fact]
    public async Task BuildResumeSystemPromptAsync_WithNullProfile_ReturnsNoProfileMessage()
    {
        // Arrange
        _resumeServiceMock.GetActiveProfileAsync().Returns((ResumeProfile?)null);

        // Act
        var prompt = await _service.BuildResumeSystemPromptAsync();

        // Assert
        prompt.ShouldContain("No active resume profile found.");
    }

    [Fact]
    public async Task BuildJobFitSystemPromptAsync_IncludesJobDescriptionAndResumeContext()
    {
        // Arrange
        var profile = new ResumeProfile { Name = "John Doe" };
        _resumeServiceMock.GetActiveProfileAsync().Returns(profile);
        _resumeServiceMock.ListSkillsAsync().Returns(new System.Collections.Generic.List<SkillCategory>());

        var jobDescription = "Looking for a Senior Software Engineer with C# experience.";

        // Act
        var prompt = await _service.BuildJobFitSystemPromptAsync(jobDescription);

        // Assert
        prompt.ShouldContain("John Doe");
        prompt.ShouldContain(jobDescription);
        prompt.ShouldContain("MatchScore");
        prompt.ShouldContain("GrowthOpportunities");
        prompt.ShouldContain("ActionChips");
    }
}
