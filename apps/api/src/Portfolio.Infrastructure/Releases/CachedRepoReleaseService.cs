using Microsoft.Extensions.Caching.Memory;
using Portfolio.Application.Releases;

namespace Portfolio.Infrastructure.Releases;

/// <summary>
/// Caching decorator around an <see cref="IRepoReleaseService"/>. Results are cached for
/// 30 minutes, keyed by <c>repo-releases:{owner}/{repo}</c>.
/// </summary>
public class CachedRepoReleaseService(IRepoReleaseService inner, IMemoryCache cache) : IRepoReleaseService
{
    internal static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(30);

    public async Task<IReadOnlyList<RepoRelease>> GetReleasesAsync(string owner, string repo, CancellationToken ct = default)
    {
        var cacheKey = BuildCacheKey(owner, repo);

        if (cache.TryGetValue(cacheKey, out var cached) && cached is IReadOnlyList<RepoRelease> cachedReleases)
        {
            return cachedReleases;
        }

        var releases = await inner.GetReleasesAsync(owner, repo, ct);
        cache.Set(cacheKey, releases, CacheDuration);
        return releases;
    }

    internal static string BuildCacheKey(string owner, string repo) => $"repo-releases:{owner}/{repo}";
}
