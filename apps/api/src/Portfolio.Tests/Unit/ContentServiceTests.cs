using NSubstitute;
using Portfolio.Application.AI;
using Portfolio.Application.Analytics.Repositories;
using Portfolio.Application.Blog.Requests;
using Portfolio.Application.Content.Repositories;
using Portfolio.Application.Content.Requests;
using Portfolio.Application.Content.Services;
using Portfolio.Application.Resume.Repositories;
using Portfolio.Domain.Content;
using Portfolio.Domain.Resume;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class ContentServiceTests
{
    private readonly IContentRepository _repositoryMock = Substitute.For<IContentRepository>();
    private readonly IAiChatService _aiServiceMock = Substitute.For<IAiChatService>();
    private readonly IAnalyticsRepository _analyticsMock = Substitute.For<IAnalyticsRepository>();
    private readonly IResumeRepository _resumeMock = Substitute.For<IResumeRepository>();
    private readonly ContentService _service;

    public ContentServiceTests()
    {
        _service = new ContentService(_repositoryMock, _resumeMock, _analyticsMock, _aiServiceMock);
    }

    [Fact]
    public async Task ListAsync_ReturnsContentResponses_WhenItemsExist()
    {
        var items = new List<ContentItem>
        {
            new BlogPost
            {
                Id = Guid.NewGuid(),
                Slug = "first-post",
                Title = "First Post",
                Content = "Content 1",
                ResumeProfileId = Guid.NewGuid(),
                DatePosted = DateTime.UtcNow
            },
            new BlogPost
            {
                Id = Guid.NewGuid(),
                Slug = "second-post",
                Title = "Second Post",
                Content = "Content 2",
                ResumeProfileId = Guid.NewGuid(),
                DatePosted = DateTime.UtcNow
            }
        };
        _repositoryMock.ListAsync(ContentType.Blog).Returns(items);
        _analyticsMock.GetPageViewsCountByPathAsync(Arg.Any<IEnumerable<string>>())
            .Returns(new Dictionary<string, int> { { "/blog/first-post", 15 } });

        var result = (await _service.ListAsync(ContentType.Blog)).ToList();

        result.Count.ShouldBe(2);
        result[0].Slug.ShouldBe("first-post");
        result[0].Views.ShouldBe(15);
        result[1].Title.ShouldBe("Second Post");
        result[1].Views.ShouldBe(0);
    }

    [Fact]
    public async Task GetAsync_ReturnsResponse_WhenItemExists()
    {
        var id = Guid.NewGuid();
        var item = new BlogPost
        {
            Id = id,
            Slug = "some-post",
            Title = "Some Post",
            Content = "Post content",
            ResumeProfileId = Guid.NewGuid(),
            DatePosted = DateTime.UtcNow
        };
        _repositoryMock.GetAsync(id, ContentType.Blog).Returns(item);
        _analyticsMock.GetPageViewsCountByPathAsync(Arg.Any<IEnumerable<string>>())
            .Returns(new Dictionary<string, int> { { "/blog/some-post", 42 } });

        var result = await _service.GetAsync(id, ContentType.Blog);

        result.ShouldNotBeNull();
        result.Id.ShouldBe(id);
        result.Slug.ShouldBe("some-post");
        result.Views.ShouldBe(42);
    }

    [Fact]
    public async Task GetAsync_ReturnsNull_WhenItemDoesNotExist()
    {
        var id = Guid.NewGuid();
        _repositoryMock.GetAsync(id, ContentType.Blog).Returns((ContentItem?)null);

        var result = await _service.GetAsync(id, ContentType.Blog);

        result.ShouldBeNull();
    }

    [Fact]
    public async Task CreateAsync_CreatesBlogPostAndReturnsResponse()
    {
        var request = new CreateContentRequest
        {
            Title = "New Post",
            Slug = "new-post",
            Summary = "Summary",
            Content = "Content",
            Visible = true,
            CanonicalUrl = "https://example.com",
            ResumeProfileId = Guid.NewGuid(),
            Tags = new List<string> { "tag1", "tag2" }
        };

        _resumeMock.GetProfileByIdAsync(request.ResumeProfileId).Returns(new ResumeProfile { Id = request.ResumeProfileId });
        _repositoryMock.GetTagByNameAsync("tag1", ContentType.Blog).Returns(new ContentTag { Name = "tag1", ContentType = ContentType.Blog });
        _repositoryMock.GetTagByNameAsync("tag2", ContentType.Blog).Returns((ContentTag?)null);

        var result = await _service.CreateAsync(ContentType.Blog, request);

        await _repositoryMock.Received(1).AddAsync(Arg.Is<BlogPost>(p =>
            p.Title == "New Post" &&
            p.Slug == "new-post" &&
            p.ResumeProfileId == request.ResumeProfileId &&
            p.ContentTags.Count == 2));
        await _repositoryMock.Received(1).AddTagAsync(Arg.Is<ContentTag>(t => t.Name == "tag2" && t.ContentType == ContentType.Blog));
        await _repositoryMock.Received(1).SaveChangesAsync();

        result.Title.ShouldBe("New Post");
        result.ResumeProfileId.ShouldBe(request.ResumeProfileId);
        result.Tags.ShouldContain("tag1");
        result.Tags.ShouldContain("tag2");
    }

    [Fact]
    public async Task CreateAsync_CreatesProjectWithLinksAndTags()
    {
        var request = new CreateContentRequest
        {
            Title = "My Project",
            Slug = "my-project",
            Summary = "Summary",
            Content = "README",
            Visible = true,
            ResumeProfileId = Guid.NewGuid(),
            Tags = new List<string> { "dotnet", "react" },
            ProjectLinks = new List<ProjectLinkRequest>
            {
                new() { Type = "github", Url = "https://github.com/example/repo" },
                new() { Type = "homepage", Url = "https://example.com" }
            }
        };

        _resumeMock.GetProfileByIdAsync(request.ResumeProfileId).Returns(new ResumeProfile { Id = request.ResumeProfileId });
        _repositoryMock.GetTagByNameAsync(Arg.Any<string>(), ContentType.Project).Returns((ContentTag?)null);

        var result = await _service.CreateAsync(ContentType.Project, request);

        await _repositoryMock.Received(1).AddAsync(Arg.Is<Project>(p =>
            p.ProjectLinks.Count == 2 &&
            p.ContentTags.Count == 2));
        result.ShouldNotBeNull();
    }

    [Fact]
    public async Task CreateAsync_ThrowsArgumentException_WhenProfileDoesNotExist()
    {
        var request = new CreateContentRequest
        {
            Title = "New Project",
            Slug = "new-project",
            Content = "content",
            Summary = "summary",
            ResumeProfileId = Guid.NewGuid()
        };

        _resumeMock.GetProfileByIdAsync(request.ResumeProfileId).Returns((ResumeProfile?)null);

        await Should.ThrowAsync<ArgumentException>(async () => await _service.CreateAsync(ContentType.Project, request));
    }

    [Fact]
    public async Task UpdateAsync_UpdatesExistingBlogPost_WhenItemExists()
    {
        var id = Guid.NewGuid();
        var existing = new BlogPost { Id = id, Title = "Old", Slug = "old", Content = "old", ResumeProfileId = Guid.NewGuid() };
        _repositoryMock.GetAsync(id, ContentType.Blog).Returns(existing);

        var request = new UpdateContentRequest
        {
            Title = "Updated Post",
            Slug = "updated",
            Summary = "Updated summary",
            Content = "Updated content",
            ResumeProfileId = existing.ResumeProfileId,
            Visible = false
        };
        _analyticsMock.GetPageViewsCountByPathAsync(Arg.Any<IEnumerable<string>>())
            .Returns(new Dictionary<string, int>());

        var result = await _service.UpdateAsync(id, ContentType.Blog, request, "editor1");

        await _repositoryMock.Received(1).UpdateAsync(existing);
        await _repositoryMock.Received(1).SaveChangesAsync();

        result.ShouldNotBeNull();
        result.Title.ShouldBe("Updated Post");
        existing.ModifiedBy.ShouldBe("editor1");
        existing.Visible.ShouldBeFalse();
    }

    [Fact]
    public async Task UpdateAsync_UpdatesExistingProject_WhenProjectExists()
    {
        var id = Guid.NewGuid();
        var existing = new Project { Id = id, Title = "Old", Slug = "old", Content = "old", ResumeProfileId = Guid.NewGuid() };
        _repositoryMock.GetAsync(id, ContentType.Project).Returns(existing);

        var request = new UpdateContentRequest
        {
            Title = "Updated Project",
            Slug = "updated-project",
            Summary = "Updated summary",
            Content = "Updated content",
            ResumeProfileId = existing.ResumeProfileId,
            Visible = true
        };

        var result = await _service.UpdateAsync(id, ContentType.Project, request, "editor1");

        await _repositoryMock.Received(1).UpdateAsync(existing);
        await _repositoryMock.Received(1).SaveChangesAsync();
        existing.ModifiedBy.ShouldBe("editor1");
        result.ShouldNotBeNull();
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNull_WhenProjectDoesNotExist()
    {
        var id = Guid.NewGuid();
        _repositoryMock.GetAsync(id, ContentType.Project).Returns((ContentItem?)null);

        var request = new UpdateContentRequest
        {
            Title = "Updated Project",
            Slug = "updated-project",
            Content = "Updated content",
            ResumeProfileId = Guid.NewGuid()
        };

        var result = await _service.UpdateAsync(id, ContentType.Project, request, "editor1");

        result.ShouldBeNull();
    }

    [Fact]
    public async Task UpdateAsync_UpdatesTags_WhenTagsProvided()
    {
        var id = Guid.NewGuid();
        var existing = new BlogPost { Id = id, Title = "Old", Slug = "old", Content = "old", ResumeProfileId = Guid.NewGuid() };
        _repositoryMock.GetAsync(id, ContentType.Blog).Returns(existing);

        var request = new UpdateContentRequest
        {
            Title = "Updated Post",
            Slug = "updated",
            Summary = "Updated summary",
            Content = "Updated content",
            ResumeProfileId = existing.ResumeProfileId,
            Tags = new List<string> { "tag1", "tag3" }
        };

        _repositoryMock.GetTagByNameAsync("tag1", ContentType.Blog).Returns(new ContentTag { Name = "tag1", Id = Guid.NewGuid(), ContentType = ContentType.Blog });
        _repositoryMock.GetTagByNameAsync("tag3", ContentType.Blog).Returns((ContentTag?)null);
        _analyticsMock.GetPageViewsCountByPathAsync(Arg.Any<IEnumerable<string>>())
            .Returns(new Dictionary<string, int>());

        var result = await _service.UpdateAsync(id, ContentType.Blog, request, "editor1");

        await _repositoryMock.Received(1).UpdateAsync(existing);
        await _repositoryMock.Received(1).SaveChangesAsync();

        result.ShouldNotBeNull();
        existing.ContentTags.Count.ShouldBe(2);
        await _repositoryMock.Received(1).AddTagAsync(Arg.Is<ContentTag>(t => t.Name == "tag3" && t.ContentType == ContentType.Blog));
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNull_WhenItemDoesNotExist()
    {
        var id = Guid.NewGuid();
        _repositoryMock.GetAsync(id, ContentType.Blog).Returns((ContentItem?)null);

        var request = new UpdateContentRequest { Title = "T", Slug = "s", Summary = "s", Content = "c", ResumeProfileId = Guid.NewGuid() };
        var result = await _service.UpdateAsync(id, ContentType.Blog, request, "editor");

        result.ShouldBeNull();
    }

    [Fact]
    public async Task UpdateAsync_ThrowsArgumentException_WhenProfileDoesNotExist()
    {
        var id = Guid.NewGuid();
        var existing = new BlogPost { Id = id, Title = "Old", Slug = "old", Content = "old", ResumeProfileId = Guid.NewGuid() };
        _repositoryMock.GetAsync(id, ContentType.Blog).Returns(existing);

        var request = new UpdateContentRequest
        {
            Title = "Updated Post",
            Slug = "updated",
            Content = "content",
            Summary = "summary",
            ResumeProfileId = Guid.NewGuid()
        };

        _resumeMock.GetProfileByIdAsync(request.ResumeProfileId).Returns((ResumeProfile?)null);

        await Should.ThrowAsync<ArgumentException>(async () => await _service.UpdateAsync(id, ContentType.Blog, request, "editor1"));
    }

    [Fact]
    public async Task DeleteAsync_CallsRepositoryDelete()
    {
        var id = Guid.NewGuid();

        await _service.DeleteAsync(id, ContentType.Project);

        await _repositoryMock.Received(1).DeleteAsync(id);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task GenerateMetadataAsync_GeneratesBoth_WhenBothMissing()
    {
        var request = new GenerateMetadataRequest
        {
            Title = "My AI Blog Post",
            Content = "This is a post about AI."
        };

        _aiServiceMock.AskQuestionAsync(Arg.Any<string>(), Arg.Is<string>(s => s.Contains("summary") && !s.Contains("URL-friendly")), Arg.Any<CancellationToken>())
            .Returns("Generated summary.");
        _aiServiceMock.AskQuestionAsync(Arg.Any<string>(), Arg.Is<string>(s => s.Contains("slug") || s.Contains("URL-friendly")), Arg.Any<CancellationToken>())
            .Returns("MY AI BLOG POST @!#");

        var result = await _service.GenerateMetadataAsync(request);

        result.Summary.ShouldBe("Generated summary.");
        result.Slug.ShouldBe("my-ai-blog-post");
    }

    [Fact]
    public async Task GenerateMetadataAsync_GeneratesOnlySlug_WhenSummaryProvided()
    {
        var request = new GenerateMetadataRequest
        {
            Title = "Test",
            Content = "Test content",
            Summary = "Existing summary"
        };

        _aiServiceMock.AskQuestionAsync(Arg.Any<string>(), Arg.Is<string>(s => s.Contains("slug") || s.Contains("URL-friendly")), Arg.Any<CancellationToken>())
            .Returns("test-slug");

        var result = await _service.GenerateMetadataAsync(request);

        result.Summary.ShouldBeNull();
        result.Slug.ShouldBe("test-slug");
        await _aiServiceMock.DidNotReceive().AskQuestionAsync(Arg.Any<string>(), Arg.Is<string>(s => s.Contains("summary") && !s.Contains("URL-friendly")), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateAsync_ReplacesProjectLinks_WhenProjectExists()
    {
        var id = Guid.NewGuid();
        var existing = new Project
        {
            Id = id,
            Title = "Old",
            Slug = "old",
            Content = "old",
            ResumeProfileId = Guid.NewGuid(),
            ProjectLinks = new List<ProjectLink>
            {
                new() { ProjectId = id, Type = "github", Url = "https://old.example/repo" }
            }
        };
        _repositoryMock.GetAsync(id, ContentType.Project).Returns(existing);

        var request = new UpdateContentRequest
        {
            Title = "Updated Project",
            Slug = "updated-project",
            Summary = "Updated summary",
            Content = "Updated content",
            ResumeProfileId = existing.ResumeProfileId,
            Visible = true,
            ProjectLinks = new List<ProjectLinkRequest>
            {
                new() { Type = "homepage", Url = "https://new.example.com", Label = "Home" },
                new() { Type = "github", Url = "https://new.example/repo", Label = "Code" }
            }
        };

        var result = await _service.UpdateAsync(id, ContentType.Project, request, "editor1");

        await _repositoryMock.Received(1).UpdateAsync(Arg.Is<Project>(p =>
            p.ProjectLinks.Count == 2 &&
            p.ProjectLinks.Any(l => l.Type == "homepage" && l.Url == "https://new.example.com") &&
            p.ProjectLinks.Any(l => l.Type == "github" && l.Url == "https://new.example/repo")));
        await _repositoryMock.Received(1).SaveChangesAsync();
        result.ShouldNotBeNull();
    }
}
