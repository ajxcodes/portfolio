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
}
