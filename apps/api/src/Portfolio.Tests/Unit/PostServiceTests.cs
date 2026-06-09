using NSubstitute;
using Portfolio.Application.Blog.Repositories;
using Portfolio.Application.Blog.Services;
using Portfolio.Domain.Blog;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class PostServiceTests
{
    private readonly IPostRepository _repositoryMock = Substitute.For<IPostRepository>();
    private readonly PostService _service;

    public PostServiceTests()
    {
        _service = new PostService(_repositoryMock);
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

        // Act
        var result = (await _service.ListAsync()).ToList();

        // Assert
        result.Count.ShouldBe(2);
        result[0].Slug.ShouldBe("first-post");
        result[1].Title.ShouldBe("Second Post");
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

        // Act
        var result = await _service.GetAsync(postId);

        // Assert
        result.ShouldNotBeNull();
        result.Id.ShouldBe(postId);
        result.Slug.ShouldBe("some-post");
    }

    [Fact]
    public async Task GetAsync_ThrowsInvalidOperationException_WhenPostDoesNotExist()
    {
        // Arrange
        var postId = Guid.NewGuid();
        _repositoryMock.GetAsync(postId).Returns((Post?)null);

        // Act & Assert
        await Should.ThrowAsync<InvalidOperationException>(async () =>
        {
            await _service.GetAsync(postId);
        });
    }
}
