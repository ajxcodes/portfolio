using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.Domain.Resume;
using Portfolio.Infrastructure.Database.Contexts;
using Portfolio.Infrastructure.Database.Repositories;
using Portfolio.Tests.Infrastructure;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Integration;

public class ResumeRepositoryIntegrationTests : IClassFixture<DbTestFixture>
{
    private readonly DbTestFixture _fixture;

    public ResumeRepositoryIntegrationTests(DbTestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task ResumeRepository_AllCrudMethods_ShouldWorkSuccessfully()
    {
        // Arrange
        using var scope = _fixture.Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        var repo = new ResumeRepository(context);

        // 1. Link Type CRUD
        var linkType = new ResumeProfileLinkType
        {
            Id = Guid.NewGuid(),
            Name = "IntegrationTestType",
            KeyIdentifier = "integration_test"
        };
        await repo.AddProfileLinkTypeAsync(linkType);
        await repo.SaveChangesAsync();

        var fetchedLinkType = await repo.GetLinkTypeByKeyAsync("integration_test");
        fetchedLinkType.ShouldNotBeNull();
        fetchedLinkType.Name.ShouldBe("IntegrationTestType");

        // 2. Profile CRUD
        var profile = new ResumeProfile
        {
            Id = Guid.NewGuid(),
            Name = "Repo Test User",
            Title = "Tester",
            Intro = "Hi",
            IsActive = false
        };
        await repo.AddProfileAsync(profile);
        await repo.SaveChangesAsync();

        var profiles = await repo.ListProfilesAsync();
        profiles.Any(p => p.Id == profile.Id).ShouldBeTrue();

        profile.Title = "Updated Tester";
        await repo.UpdateProfileAsync(profile);
        await repo.SaveChangesAsync();

        var updatedProfile = await repo.GetProfileByIdAsync(profile.Id);
        updatedProfile.ShouldNotBeNull();
        updatedProfile.Title.ShouldBe("Updated Tester");

        // 3. Profile Link CRUD
        var profileLink = new ResumeProfileLink
        {
            Id = Guid.NewGuid(),
            ProfileId = profile.Id,
            LinkTypeId = linkType.Id,
            Url = "https://example.com/test-repo"
        };
        await repo.AddProfileLinkAsync(profileLink);
        await repo.SaveChangesAsync();

        var exists = await repo.LinkExistsAsync(profileLink.Id);
        exists.ShouldBeTrue();

        var fetchedLink = await repo.GetLinkByIdAsync(profileLink.Id);
        fetchedLink.ShouldNotBeNull();
        fetchedLink.Url.ShouldBe("https://example.com/test-repo");

        // 4. Skills Category CRUD
        var category = new SkillCategory
        {
            Id = Guid.NewGuid(),
            CategoryName = "Repo Skills",
            DisplayOrder = 99
        };
        await repo.AddSkillCategoryAsync(category);
        await repo.SaveChangesAsync();

        var categories = await repo.ListSkillsAsync();
        categories.Any(c => c.Id == category.Id).ShouldBeTrue();

        category.CategoryName = "Updated Repo Skills";
        await repo.UpdateSkillCategoryAsync(category);
        await repo.SaveChangesAsync();

        // 5. Skill CRUD
        var skill = new Skill
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            SkillName = "Testing Skill",
            DisplayOrder = 1
        };
        await repo.AddSkillAsync(skill);
        await repo.SaveChangesAsync();

        skill.SkillName = "Updated Testing Skill";
        await repo.UpdateSkillAsync(skill);
        await repo.SaveChangesAsync();

        // 6. Experience CRUD
        var experience = new WorkExperience
        {
            Id = Guid.NewGuid(),
            ProfileId = profile.Id,
            Company = "Repo Company",
            Role = "QA",
            Period = "2020",
            IsPrevious = true,
            DisplayOrder = 1
        };
        await repo.AddWorkExperienceAsync(experience);
        await repo.SaveChangesAsync();

        var highlight = new ExperienceHighlight
        {
            Id = Guid.NewGuid(),
            ExperienceId = experience.Id,
            ResultText = "Did a lot of testing",
            DisplayOrder = 1
        };
        await repo.AddExperienceHighlightAsync(highlight);
        await repo.SaveChangesAsync();

        var expSkill = new WorkExperienceSkill
        {
            WorkExperienceId = experience.Id,
            SkillId = skill.Id
        };
        await repo.AddWorkExperienceSkillAsync(expSkill);
        await repo.SaveChangesAsync();

        // 7. Cleanup & Delete operations
        await repo.RemoveLinksByProfileIdAsync(profile.Id);
        await repo.RemoveWorkExperiencesByProfileIdAsync(profile.Id);
        await repo.SaveChangesAsync();

        (await repo.LinkExistsAsync(profileLink.Id)).ShouldBeFalse();

        await repo.DeleteSkillAsync(skill.Id);
        await repo.DeleteSkillCategoryAsync(category.Id);
        await repo.DeleteProfileAsync(profile.Id);
        await repo.SaveChangesAsync();
    }
}
