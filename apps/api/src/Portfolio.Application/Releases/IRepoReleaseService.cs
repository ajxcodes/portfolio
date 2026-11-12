namespace Portfolio.Application.Releases;

/// <summary>
/// Provider-agnostic port for resolving the releases published for a source-code repository.
/// The port is deliberately free of any dependency on the portfolio domain model: it takes an
/// <c>owner</c>/<c>repo</c> pair and never a project id.
/// </summary>
public interface IRepoReleaseService
{
    Task<IReadOnlyList<RepoRelease>> GetReleasesAsync(string owner, string repo, CancellationToken ct = default);
}
