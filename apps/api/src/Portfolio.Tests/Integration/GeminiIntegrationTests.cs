using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Portfolio.Infrastructure.AI;
using Xunit;
using Xunit.Abstractions;

namespace Portfolio.Tests.Integration;

public class GeminiIntegrationTests
{
    private readonly ITestOutputHelper _output;

    public GeminiIntegrationTests(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task AskQuestionStreamAsync_WithValidKey_ReturnsResponse_OrSkipsOn429()
    {
        var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        if (string.IsNullOrEmpty(apiKey))
        {
            _output.WriteLine("GEMINI_API_KEY not found in environment. Skipping live test.");
            return; // Can't easily use Assert.Skip in older xUnit, so we just return to pass.
        }

        var config = Substitute.For<IConfiguration>();
        config["GEMINI_API_KEY"].Returns(apiKey);
        config["AI_TEMPERATURE"].Returns("0.1");

        var httpClient = new HttpClient();
        var logger = Substitute.For<ILogger<GeminiChatService>>();
        var service = new GeminiChatService(httpClient, config, logger);

        try
        {
            var responseStream = service.AskQuestionStreamAsync("You are a helpful assistant.", "Reply with 'pong'");
            bool receivedChunk = false;
            await foreach (var chunk in responseStream)
            {
                receivedChunk = true;
                _output.WriteLine(chunk);
            }
            Assert.True(receivedChunk, "Expected at least one chunk from Gemini.");
        }
        catch (HttpRequestException ex) when (ex.Message.Contains("429"))
        {
            _output.WriteLine("Gemini API Rate Limit Exceeded (429). Skipping test gracefully.");
        }
        catch (Exception ex) when (ex.Message.Contains("429") || ex.Message.Contains("Too Many Requests"))
        {
            _output.WriteLine("Gemini API Rate Limit Exceeded (429). Skipping test gracefully.");
        }
    }
}
