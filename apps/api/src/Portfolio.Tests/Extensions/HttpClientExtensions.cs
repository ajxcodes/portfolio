using System.Net.Http.Json;
using System.Text.Json;

namespace Portfolio.Tests.Extensions;

public static class HttpClientExtensions
{
    public static async Task<T> GetFromJsonOrReportErrorAsync<T>(this HttpClient client, string requestUri)
    {
        var response = await client.GetAsync(requestUri);
        await response.EnsureSuccessOrReportErrorAsync();

        try
        {
            var result = await response.Content.ReadFromJsonAsync<T>();
            if (result == null)
            {
                throw new InvalidOperationException("Response content deserialized to null.");
            }
            return result;
        }
        catch (JsonException ex)
        {
            var rawContent = await response.Content.ReadAsStringAsync();
            throw new JsonException(
                $"Failed to deserialize response from '{requestUri}' as type '{typeof(T).Name}'. " +
                $"Raw response content was:\n{rawContent}", ex);
        }
    }
}
