namespace Portfolio.Application.Releases;

/// <summary>
/// Application-level policy for locating the source-code repository behind a project link.
/// Only GitHub repository URLs are recognised; anything else is rejected so the caller can
/// degrade gracefully to an empty release list.
/// </summary>
public static class GitHubRepoLocator
{
    private static readonly string[] SupportedHosts = { "github.com", "www.github.com" };

    public static bool TryExtractOwnerAndRepo(string url, out string owner, out string repo)
    {
        owner = string.Empty;
        repo = string.Empty;

        if (string.IsNullOrWhiteSpace(url))
        {
            return false;
        }

        if (!Uri.TryCreate(url.Trim(), UriKind.Absolute, out var uri))
        {
            return false;
        }

        if (!SupportedHosts.Contains(uri.Host, StringComparer.OrdinalIgnoreCase))
        {
            return false;
        }

        var segments = uri.AbsolutePath
            .Split('/', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => Uri.UnescapeDataString(s))
            .ToList();

        if (segments.Count < 2)
        {
            return false;
        }

        owner = segments[0];
        repo = segments[1];

        if (repo.EndsWith(".git", StringComparison.OrdinalIgnoreCase))
        {
            repo = repo[..^".git".Length];
        }

        return !string.IsNullOrWhiteSpace(owner) && !string.IsNullOrWhiteSpace(repo);
    }
}
