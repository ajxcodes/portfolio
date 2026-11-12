using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Portfolio.Application.Releases;

namespace Portfolio.Infrastructure.Releases;

/// <summary>
/// GitHub adapter for <see cref="IRepoReleaseService"/>. Every failure path - a non-success
/// status code, a malformed payload, a network error or a timeout - degrades to an empty
/// release list instead of throwing.
/// </summary>
public class GitHubReleaseService(HttpClient httpClient, IConfiguration configuration) : IRepoReleaseService
{
    internal const string BaseUrlConfigKey = "GITHUB_API_BASE_URL";
    internal const string TokenConfigKey = "GITHUB_API_TOKEN";

    private const string DefaultBaseUrl = "https://api.github.com";

    private readonly string _baseUrl = ResolveBaseUrl(configuration);
    private readonly string? _token = configuration[TokenConfigKey];

    public async Task<IReadOnlyList<RepoRelease>> GetReleasesAsync(string owner, string repo, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(owner) || string.IsNullOrWhiteSpace(repo))
        {
            return Array.Empty<RepoRelease>();
        }

        try
        {
            var url = $"{_baseUrl}/repos/{Uri.EscapeDataString(owner)}/{Uri.EscapeDataString(repo)}/releases";

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
            request.Headers.UserAgent.ParseAdd("ajxcodes-portfolio");

            if (!string.IsNullOrWhiteSpace(_token))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);
            }

            using var response = await httpClient.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
            {
                return Array.Empty<RepoRelease>();
            }

            var payload = await response.Content.ReadAsStringAsync(ct);
            return ParseReleases(payload);
        }
        catch (HttpRequestException)
        {
            return Array.Empty<RepoRelease>();
        }
        catch (OperationCanceledException)
        {
            return Array.Empty<RepoRelease>();
        }
        catch (JsonException)
        {
            return Array.Empty<RepoRelease>();
        }
    }

    private static string ResolveBaseUrl(IConfiguration configuration)
    {
        var configured = configuration[BaseUrlConfigKey];
        return string.IsNullOrWhiteSpace(configured)
            ? DefaultBaseUrl
            : configured.Trim().TrimEnd('/');
    }

    private static IReadOnlyList<RepoRelease> ParseReleases(string payload)
    {
        using var document = JsonDocument.Parse(payload);
        if (document.RootElement.ValueKind != JsonValueKind.Array)
        {
            return Array.Empty<RepoRelease>();
        }

        var releases = new List<RepoRelease>();
        foreach (var element in document.RootElement.EnumerateArray())
        {
            if (element.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            releases.Add(new RepoRelease
            {
                TagName = ReadString(element, "tag_name") ?? string.Empty,
                Name = ReadString(element, "name"),
                Url = ReadString(element, "html_url") ?? string.Empty,
                PublishedAt = ReadPublishedAt(element),
                IsPrerelease = ReadBoolean(element, "prerelease")
            });
        }

        return releases;
    }

    private static string? ReadString(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    private static bool ReadBoolean(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var value) && value.ValueKind is JsonValueKind.True or JsonValueKind.False
            ? value.GetBoolean()
            : false;

    private static DateTimeOffset ReadPublishedAt(JsonElement element)
    {
        var raw = ReadString(element, "published_at");
        return !string.IsNullOrWhiteSpace(raw) && DateTimeOffset.TryParse(raw, out var parsed)
            ? parsed
            : default;
    }
}
