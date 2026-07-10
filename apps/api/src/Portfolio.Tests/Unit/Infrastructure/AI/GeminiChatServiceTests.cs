using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Portfolio.Infrastructure.AI;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit.Infrastructure.AI;

public class GeminiChatServiceTests
{
    private readonly IConfiguration _configMock = Substitute.For<IConfiguration>();
    private readonly ILogger<GeminiChatService> _loggerMock = Substitute.For<ILogger<GeminiChatService>>();

    [Fact]
    public void Constructor_WithoutApiKey_LogsWarning()
    {
        // Arrange
        _configMock["GEMINI_API_KEY"].Returns((string?)null);
        var httpClient = new HttpClient();

        // Act
        var service = new GeminiChatService(httpClient, _configMock, _loggerMock);

        // Assert
        _loggerMock.Received(1).Log(
            LogLevel.Warning,
            Arg.Any<EventId>(),
            Arg.Is<object>(o => o != null && o.ToString()!.Contains("GEMINI_API_KEY is not configured")),
            null,
            Arg.Any<Func<object, Exception?, string>>()!);
    }

    [Fact]
    public async Task AskQuestionAsync_WithoutApiKey_ThrowsInvalidOperationException()
    {
        // Arrange
        _configMock["GEMINI_API_KEY"].Returns((string?)null);
        var httpClient = new HttpClient();
        var service = new GeminiChatService(httpClient, _configMock, _loggerMock);

        // Act & Assert
        await Should.ThrowAsync<InvalidOperationException>(() => 
            service.AskQuestionAsync("System", "User"));
    }

    [Fact]
    public async Task AskQuestionStreamAsync_WithoutApiKey_ThrowsInvalidOperationException()
    {
        // Arrange
        _configMock["GEMINI_API_KEY"].Returns((string?)null);
        var httpClient = new HttpClient();
        var service = new GeminiChatService(httpClient, _configMock, _loggerMock);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await foreach (var _ in service.AskQuestionStreamAsync("System", "User"))
            {
            }
        });
        ex.Message.ShouldContain("GEMINI_API_KEY is not configured");
    }

    [Fact]
    public async Task AskQuestionAsync_ValidResponse_ReturnsExtractedText()
    {
        // Arrange
        _configMock["GEMINI_API_KEY"].Returns("test-api-key");
        
        var jsonResponse = @"{
            ""candidates"": [
                {
                    ""content"": {
                        ""parts"": [
                            { ""text"": ""Hello from Gemini!"" }
                        ]
                    }
                }
            ]
        }";
        
        var httpMessageHandler = new MockHttpMessageHandler(jsonResponse, HttpStatusCode.OK);
        var httpClient = new HttpClient(httpMessageHandler);
        var service = new GeminiChatService(httpClient, _configMock, _loggerMock);

        // Act
        var result = await service.AskQuestionAsync("System", "User");

        // Assert
        result.ShouldBe("Hello from Gemini!");
    }

    [Fact]
    public async Task AskQuestionAsync_EmptyResponse_ReturnsEmptyString()
    {
        // Arrange
        _configMock["GEMINI_API_KEY"].Returns("test-api-key");
        
        var jsonResponse = @"{""candidates"": []}";
        var httpMessageHandler = new MockHttpMessageHandler(jsonResponse, HttpStatusCode.OK);
        var httpClient = new HttpClient(httpMessageHandler);
        var service = new GeminiChatService(httpClient, _configMock, _loggerMock);

        // Act
        var result = await service.AskQuestionAsync("System", "User");

        // Assert
        result.ShouldBe(string.Empty);
    }

    [Fact]
    public async Task AskQuestionStreamAsync_NetworkError_ReturnsOfflineMessage()
    {
        // Arrange
        _configMock["GEMINI_API_KEY"].Returns("test-api-key");
        
        var httpMessageHandler = new MockHttpMessageHandler(string.Empty, HttpStatusCode.InternalServerError, throwException: true);
        var httpClient = new HttpClient(httpMessageHandler);
        var service = new GeminiChatService(httpClient, _configMock, _loggerMock);

        // Act
        string? result = null;
        await foreach (var chunk in service.AskQuestionStreamAsync("System", "User"))
        {
            result = chunk;
        }

        // Assert
        result.ShouldNotBeNull();
        result.ShouldContain("offline");
    }

    [Fact]
    public async Task AskQuestionStreamAsync_ValidStream_YieldsExtractedText()
    {
        // Arrange
        _configMock["GEMINI_API_KEY"].Returns("test-api-key");
        
        var streamData = 
            "data: { \"candidates\": [ { \"content\": { \"parts\": [ { \"text\": \"Hello \" } ] } } ] }\n" +
            "data: { \"candidates\": [ { \"content\": { \"parts\": [ { \"text\": \"World\" } ] } } ] }\n" +
            "data: [DONE]\n";
            
        var httpMessageHandler = new MockHttpMessageHandler(streamData, HttpStatusCode.OK);
        var httpClient = new HttpClient(httpMessageHandler);
        var service = new GeminiChatService(httpClient, _configMock, _loggerMock);

        // Act
        var results = new System.Collections.Generic.List<string>();
        await foreach (var chunk in service.AskQuestionStreamAsync("System", "User"))
        {
            results.Add(chunk);
        }

        // Assert
        results.ShouldBe(new[] { "Hello ", "World" });
    }

    public class MockHttpMessageHandler : HttpMessageHandler
    {
        private readonly string _responseContent;
        private readonly HttpStatusCode _statusCode;
        private readonly bool _throwException;

        public MockHttpMessageHandler(string responseContent, HttpStatusCode statusCode, bool throwException = false)
        {
            _responseContent = responseContent;
            _statusCode = statusCode;
            _throwException = throwException;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (_throwException)
            {
                throw new HttpRequestException("Network error");
            }

            var response = new HttpResponseMessage(_statusCode)
            {
                Content = new StringContent(_responseContent)
            };
            return Task.FromResult(response);
        }
    }
}
