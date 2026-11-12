namespace Portfolio.Application.Releases;

/// <summary>
/// A single published release of a source-code repository.
/// </summary>
public record RepoRelease
{
    public string TagName { get; init; } = string.Empty;
    public string? Name { get; init; }
    public string Url { get; init; } = string.Empty;
    public DateTimeOffset PublishedAt { get; init; }
    public bool IsPrerelease { get; init; }
}
