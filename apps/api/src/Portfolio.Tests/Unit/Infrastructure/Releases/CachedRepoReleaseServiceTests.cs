using Microsoft.Extensions.Caching.Memory;
using NSubstitute;
using Portfolio.Application.Releases;
using Portfolio.Infrastructure.Releases;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit.Infrastructure.Releases;

public class CachedRepoReleaseServiceTests
{
    [Fact]
    public async Task GetReleasesAsync_CachesResultPerOwnerAndRepo()
    {
        var inner = Substitute.For<IRepoReleaseService>();
        inner.GetReleasesAsync("example", "alpha-seed", Arg.Any<CancellationToken>())
            .Returns(new List<RepoRelease> { new() { TagName = "v1.0.0" } });
        inner.GetReleasesAsync("example", "beta-seed", Arg.Any<CancellationToken>())
            .Returns(new List<RepoRelease> { new() { TagName = "v2.0.0" } });

        using var cache = new MemoryCache(new MemoryCacheOptions());
        var service = new CachedRepoReleaseService(inner, cache);

        var first = await service.GetReleasesAsync("example", "alpha-seed");
        var second = await service.GetReleasesAsync("example", "alpha-seed");

        first.ShouldHaveSingleItem();
        second.ShouldHaveSingleItem();
        first[0].TagName.ShouldBe("v1.0.0");
        second[0].TagName.ShouldBe("v1.0.0");
        await inner.Received(1).GetReleasesAsync("example", "alpha-seed", Arg.Any<CancellationToken>());

        await service.GetReleasesAsync("example", "beta-seed");

        await inner.Received(1).GetReleasesAsync("example", "beta-seed", Arg.Any<CancellationToken>());
    }
}
