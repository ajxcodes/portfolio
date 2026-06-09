namespace Portfolio.Tests.Extensions;

public static class HttpResponseExtensions
{
    public static async Task EnsureSuccessOrReportErrorAsync(this HttpResponseMessage response)
    {
        if (!response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException(
                $"Response status code does not indicate success: {(int)response.StatusCode} ({response.ReasonPhrase}). " +
                $"Response content:\n{content}");
        }
    }
}
