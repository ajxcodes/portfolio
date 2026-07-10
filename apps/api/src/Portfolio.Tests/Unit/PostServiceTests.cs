using NSubstitute;
using Portfolio.Application.AI;
using Portfolio.Application.Analytics.Repositories;
using Portfolio.Application.Blog.Repositories;
using Portfolio.Application.Blog.Requests;
using Portfolio.Application.Blog.Responses;
using Portfolio.Application.Blog.Services;
using Portfolio.Domain.Blog;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class PostServiceTests
{
    private readonly IPostRepository _repositoryMock = Substitute.For<IPostRepository>();
    private readonly IAiChatService _aiServiceMock = Substitute.For<IAiChatService>();
    private readonly IAnalyticsRepository _analyticsMock = Substitute.For<IAnalyticsRepository>();
    private readonly PostService _service;

    public PostServiceTests()
    {
        _service = new PostService(_repositoryMock, _aiServiceMock, _analyticsMock);
    }

    [Fact]
    public async Task ListAsync_ReturnsPostResponses_WhenPostsExist()
    {
        // Arrange
        var posts = new List<Post>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Slug = "first-post",
                Title = "First Post",
                Content = "Content 1",
                PostedBy = "admin",
                DatePosted = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                Slug = "second-post",
                Title = "Second Post",
                Content = "Content 2",
                PostedBy = "admin",
                DatePosted = DateTime.UtcNow
            }
        };
        _repositoryMock.ListAsync().Returns(posts);
        _analyticsMock.GetPageViewsCountByPathAsync(Arg.Any<IEnumerable<string>>())
            .Returns(new Dictionary<string, int> { { "/blog/first-post", 15 } });

        // Act
        var result = (await _service.ListAsync()).ToList();

        // Assert
        result.Count.ShouldBe(2);
        result[0].Slug.ShouldBe("first-post");
        result[0].Views.ShouldBe(15);
        result[1].Title.ShouldBe("Second Post");
        result[1].Views.ShouldBe(0);
    }

    [Fact]
    public async Task GetAsync_ReturnsPostResponse_WhenPostExists()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var post = new Post
        {
            Id = postId,
            Slug = "some-post",
            Title = "Some Post",
            Content = "Post content",
            PostedBy = "admin",
            DatePosted = DateTime.UtcNow
        };
        _repositoryMock.GetAsync(postId).Returns(post);
        _analyticsMock.GetPageViewsCountByPathAsync(Arg.Any<IEnumerable<string>>())
            .Returns(new Dictionary<string, int> { { "/blog/some-post", 42 } });

        // Act
        var result = await _service.GetAsync(postId);

        // Assert
        result.ShouldNotBeNull();
        result.Id.ShouldBe(postId);
        result.Slug.ShouldBe("some-post");
        result.Views.ShouldBe(42);
    }

    [Fact]
    public async Task GetAsync_ReturnsNull_WhenPostDoesNotExist()
    {
        // Arrange
        var postId = Guid.NewGuid();
        _repositoryMock.GetAsync(postId).Returns((Post?)null);

        // Act
        var result = await _service.GetAsync(postId);

        // Assert
        result.ShouldBeNull();
    }

    [Fact]
    public async Task CreateAsync_CreatesPostAndReturnsResponse()
    {
        var request = new CreatePostRequest
        {
            Title = "New Post",
            Slug = "new-post",
            Summary = "Summary",
            Content = "Content",
            Visible = true,
            CanonicalUrl = "https://example.com",
            Tags = new List<string> { "tag1", "tag2" }
        };
        var author = "author1";

        _repositoryMock.GetTagByNameAsync("tag1").Returns(new Tag { Name = "tag1" });
        _repositoryMock.GetTagByNameAsync("tag2").Returns((Tag?)null);

        var result = await _service.CreateAsync(request, author);

        await _repositoryMock.Received(1).AddAsync(Arg.Is<Post>(p => 
            p.Title == "New Post" && 
            p.Slug == "new-post" && 
            p.PostedBy == author &&
            p.PostTags.Count == 2));
        await _repositoryMock.Received(1).AddTagAsync(Arg.Is<Tag>(t => t.Name == "tag2"));
        await _repositoryMock.Received(1).SaveChangesAsync();
        
        result.Title.ShouldBe("New Post");
        result.PostedBy.ShouldBe(author);
        result.Tags.ShouldContain("tag1");
        result.Tags.ShouldContain("tag2");
    }

    [Fact]
    public async Task UpdateAsync_UpdatesExistingPost_WhenPostExists()
    {
        var id = Guid.NewGuid();
        var existingPost = new Post { Id = id, Title = "Old", Slug = "old", Content = "old", PostedBy = "admin" };
        _repositoryMock.GetAsync(id).Returns(existingPost);

        var request = new UpdatePostRequest
        {
            Title = "Updated Post",
            Slug = "updated",
            Summary = "Updated summary",
            Content = "Updated content",
            Visible = false
        };
        var editor = "editor1";
        
        _analyticsMock.GetPageViewsCountByPathAsync(Arg.Any<IEnumerable<string>>())
            .Returns(new Dictionary<string, int>());

        var result = await _service.UpdateAsync(id, request, editor);

        await _repositoryMock.Received(1).UpdateAsync(existingPost);
        await _repositoryMock.Received(1).SaveChangesAsync();
        
        result.ShouldNotBeNull();
        result.Title.ShouldBe("Updated Post");
        existingPost.ModifiedBy.ShouldBe(editor);
        existingPost.Visible.ShouldBeFalse();
    }

    [Fact]
    public async Task UpdateAsync_UpdatesTags_WhenTagsProvided()
    {
        var id = Guid.NewGuid();
        var existingPost = new Post { Id = id, Title = "Old", Slug = "old", Content = "old", PostedBy = "admin" };
        _repositoryMock.GetAsync(id).Returns(existingPost);

        var request = new UpdatePostRequest
        {
            Title = "Updated Post",
            Slug = "updated",
            Summary = "Updated summary",
            Content = "Updated content",
            Tags = new List<string> { "tag1", "tag3" }
        };
        var editor = "editor1";

        _repositoryMock.GetTagByNameAsync("tag1").Returns(new Tag { Name = "tag1", Id = Guid.NewGuid() });
        _repositoryMock.GetTagByNameAsync("tag3").Returns((Tag?)null);

        _analyticsMock.GetPageViewsCountByPathAsync(Arg.Any<IEnumerable<string>>())
            .Returns(new Dictionary<string, int>());

        var result = await _service.UpdateAsync(id, request, editor);

        await _repositoryMock.Received(1).UpdateAsync(existingPost);
        await _repositoryMock.Received(1).SaveChangesAsync();
        
        result.ShouldNotBeNull();
        existingPost.PostTags.Count.ShouldBe(2);
        await _repositoryMock.Received(1).AddTagAsync(Arg.Is<Tag>(t => t.Name == "tag3"));
    }

    [Fact]
    public async Task UpdateAsync_ReturnsNull_WhenPostDoesNotExist()
    {
        var id = Guid.NewGuid();
        _repositoryMock.GetAsync(id).Returns((Post?)null);

        var request = new UpdatePostRequest { Title = "T", Slug = "s", Summary = "s", Content = "c" };
        var result = await _service.UpdateAsync(id, request, "editor");

        result.ShouldBeNull();
    }

    [Fact]
    public async Task DeleteAsync_CallsRepositoryDelete()
    {
        var id = Guid.NewGuid();
        
        await _service.DeleteAsync(id);

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

        _aiServiceMock.AskQuestionAsync(Arg.Any<string>(), Arg.Is<string>(s => s.Contains("summary") && !s.Contains("URL-friendly")))
            .Returns("Generated summary.");
        _aiServiceMock.AskQuestionAsync(Arg.Any<string>(), Arg.Is<string>(s => s.Contains("slug") || s.Contains("URL-friendly")))
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

        _aiServiceMock.AskQuestionAsync(Arg.Any<string>(), Arg.Is<string>(s => s.Contains("slug") || s.Contains("URL-friendly")))
            .Returns("test-slug");

        var result = await _service.GenerateMetadataAsync(request);

        result.Summary.ShouldBeNull(); // We don't overwrite if it wasn't requested/missing
        result.Slug.ShouldBe("test-slug");
        await _aiServiceMock.DidNotReceive().AskQuestionAsync(Arg.Any<string>(), Arg.Is<string>(s => s.Contains("summary") && !s.Contains("URL-friendly")));
    }
}
