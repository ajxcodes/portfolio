using System.Net;
using System.Net.Http;
using Microsoft.Extensions.Configuration;
using NSubstitute;
using Portfolio.Infrastructure.Releases;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit.Infrastructure.Releases;

public class GitHubReleaseServiceTests
{
    private readonly IConfiguration _configuration = Substitute.For<IConfiguration>();

    [Fact]
    public async Task GetReleasesAsync_ReturnsMappedReleases_WhenGitHubResponds()
    {
        const string payload = """
        [
          {
            "tag_name": "v1.0.0",
            "name": "First release",
            "html_url": "https://github.com/example/alpha-seed/releases/tag/v1.0.0",
            "published_at": "2026-01-05T10:00:00Z",
            "prerelease": false
          }
        ]
        """;

        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(payload)
        });
        var service = new GitHubReleaseService(new HttpClient(handler), _configuration);

        var result = await service.GetReleasesAsync("example", "alpha-seed");

        result.ShouldHaveSingleItem();
        result[0].TagName.ShouldBe("v1.0.0");
        result[0].Name.ShouldBe("First release");
        result[0].Url.ShouldBe("https://github.com/example/alpha-seed/releases/tag/v1.0.0");
        result[0].PublishedAt.ShouldBe(new DateTimeOffset(2026, 1, 5, 10, 0, 0, TimeSpan.Zero));
        result[0].IsPrerelease.ShouldBeFalse();
    }

    [Fact]
    public async Task GetReleasesAsync_ReturnsEmptyList_WhenGitHubReturnsNotFoundOrRateLimit()
    {
        var notFoundHandler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.NotFound));
        var notFoundService = new GitHubReleaseService(new HttpClient(notFoundHandler), _configuration);

        var notFoundResult = await notFoundService.GetReleasesAsync("example", "alpha-seed");

        notFoundResult.ShouldBeEmpty();

        var rateLimitHandler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.Forbidden));
        var rateLimitService = new GitHubReleaseService(new HttpClient(rateLimitHandler), _configuration);

        var rateLimitResult = await rateLimitService.GetReleasesAsync("example", "alpha-seed");

        rateLimitResult.ShouldBeEmpty();
    }

    [Fact]
    public async Task GetReleasesAsync_ReturnsEmptyList_WhenRequestFailsOrPayloadIsMalformed()
    {
        var failingHandler = new ThrowingHttpMessageHandler(new HttpRequestException("network down"));
        var failingService = new GitHubReleaseService(new HttpClient(failingHandler), _configuration);

        var failedResult = await failingService.GetReleasesAsync("example", "alpha-seed");

        failedResult.ShouldBeEmpty();

        var malformedHandler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{ this is not json")
        });
        var malformedService = new GitHubReleaseService(new HttpClient(malformedHandler), _configuration);

        var malformedResult = await malformedService.GetReleasesAsync("example", "alpha-seed");

        malformedResult.ShouldBeEmpty();
    }

    [Fact]
    public async Task GetReleasesAsync_UsesTheConfiguredBaseUrlAndBearerToken()
    {
        var configuration = Substitute.For<IConfiguration>();
        configuration["GITHUB_API_BASE_URL"].Returns("http://github-stub:3000");
        configuration["GITHUB_API_TOKEN"].Returns("secret-token");

        HttpRequestMessage? captured = null;
        var handler = new StubHttpMessageHandler(request =>
        {
            captured = request;
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("[]") };
        });
        var service = new GitHubReleaseService(new HttpClient(handler), configuration);

        var result = await service.GetReleasesAsync("example", "alpha-seed");

        result.ShouldBeEmpty();
        captured.ShouldNotBeNull();
        captured!.RequestUri.ShouldNotBeNull();
        captured.RequestUri!.ToString().ShouldBe("http://github-stub:3000/repos/example/alpha-seed/releases");
        captured.Headers.Authorization.ShouldNotBeNull();
        captured.Headers.Authorization!.Scheme.ShouldBe("Bearer");
        captured.Headers.Authorization.Parameter.ShouldBe("secret-token");
    }

    [Fact]
    public async Task GetReleasesAsync_ReturnsEmptyList_WhenOwnerOrRepoIsMissing()
    {
        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("[]")
        });
        var service = new GitHubReleaseService(new HttpClient(handler), _configuration);

        (await service.GetReleasesAsync("", "alpha-seed")).ShouldBeEmpty();
        (await service.GetReleasesAsync("example", "  ")).ShouldBeEmpty();
    }

    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(responder(request));
    }

    private sealed class ThrowingHttpMessageHandler(Exception exception) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromException<HttpResponseMessage>(exception);
    }
}
