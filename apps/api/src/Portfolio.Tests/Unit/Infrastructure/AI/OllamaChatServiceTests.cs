using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using NSubstitute;
using Portfolio.Infrastructure.AI;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit.Infrastructure.AI;

public class OllamaChatServiceTests
{
    [Fact]
    public async Task AskQuestionStreamAsync_ShouldReturnStreamedContent()
    {
        // Arrange
        var configuration = Substitute.For<IConfiguration>();
        configuration["OLLAMA_ENDPOINT"].Returns("http://localhost:11434");
        configuration["OLLAMA_MODEL"].Returns("gemma2:2b");
        configuration["AI_TEMPERATURE"].Returns("0.1");

        var responseContent = new StringBuilder();
        responseContent.AppendLine("{\"model\":\"gemma2:2b\",\"message\":{\"role\":\"assistant\",\"content\":\"Hello\"},\"done\":false}");
        responseContent.AppendLine("{\"model\":\"gemma2:2b\",\"message\":{\"role\":\"assistant\",\"content\":\" World\"},\"done\":true}");

        var mockHandler = new MockHttpMessageHandler(responseContent.ToString());
        var httpClient = new HttpClient(mockHandler);

        var service = new OllamaChatService(httpClient, configuration);

        // Act
        var result = new List<string>();
        await foreach (var chunk in service.AskQuestionStreamAsync("system", "user"))
        {
            result.Add(chunk);
        }

        // Assert
        result.Count.ShouldBe(2);
        result[0].ShouldBe("Hello");
        result[1].ShouldBe(" World");
    }

    [Fact]
    public async Task AskQuestionStreamAsync_ShouldThrowOnFailedStatusCode()
    {
        // Arrange
        var configuration = Substitute.For<IConfiguration>();
        configuration["OLLAMA_ENDPOINT"].Returns("http://localhost:11434");

        var mockHandler = new MockHttpMessageHandler("", HttpStatusCode.InternalServerError);
        var httpClient = new HttpClient(mockHandler);

        var service = new OllamaChatService(httpClient, configuration);

        // Act & Assert
        await Should.ThrowAsync<HttpRequestException>(async () =>
        {
            await foreach (var chunk in service.AskQuestionStreamAsync("system", "user"))
            {
                // Should throw before yielding
            }
        });
    }

    private class MockHttpMessageHandler : HttpMessageHandler
    {
        private readonly string _responseContent;
        private readonly HttpStatusCode _statusCode;

        public MockHttpMessageHandler(string responseContent, HttpStatusCode statusCode = HttpStatusCode.OK)
        {
            _responseContent = responseContent;
            _statusCode = statusCode;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var response = new HttpResponseMessage(_statusCode);
            if (_statusCode == HttpStatusCode.OK)
            {
                response.Content = new StringContent(_responseContent, Encoding.UTF8, "application/json");
            }
            return Task.FromResult(response);
        }
    }
}
