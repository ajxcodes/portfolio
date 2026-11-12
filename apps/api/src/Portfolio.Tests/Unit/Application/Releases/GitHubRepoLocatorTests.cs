using Portfolio.Application.Releases;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit.Application.Releases;

public class GitHubRepoLocatorTests
{
    [Fact]
    public void TryExtractOwnerAndRepo_ParsesGitHubRepositoryUrls_AndRejectsOtherHosts()
    {
        GitHubRepoLocator.TryExtractOwnerAndRepo("https://github.com/example/alpha-seed", out var owner, out var repo).ShouldBeTrue();
        owner.ShouldBe("example");
        repo.ShouldBe("alpha-seed");

        GitHubRepoLocator.TryExtractOwnerAndRepo("https://gitlab.com/example/alpha-seed", out _, out _).ShouldBeFalse();
    }

    [Theory]
    [InlineData("https://www.github.com/example/alpha-seed", "example", "alpha-seed")]
    [InlineData("https://github.com/example/alpha-seed.git", "example", "alpha-seed")]
    [InlineData("https://github.com/example/alpha-seed/tree/main", "example", "alpha-seed")]
    [InlineData("https://github.com/example/alpha-seed/", "example", "alpha-seed")]
    public void TryExtractOwnerAndRepo_SupportsTheCommonGitHubUrlShapes(string url, string expectedOwner, string expectedRepo)
    {
        GitHubRepoLocator.TryExtractOwnerAndRepo(url, out var owner, out var repo).ShouldBeTrue();
        owner.ShouldBe(expectedOwner);
        repo.ShouldBe(expectedRepo);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-a-url")]
    [InlineData("https://github.com/example")]
    [InlineData("https://bitbucket.org/example/alpha-seed")]
    public void TryExtractOwnerAndRepo_RejectsUrlsThatAreNotGitHubRepositories(string url)
    {
        GitHubRepoLocator.TryExtractOwnerAndRepo(url, out _, out _).ShouldBeFalse();
    }
}
