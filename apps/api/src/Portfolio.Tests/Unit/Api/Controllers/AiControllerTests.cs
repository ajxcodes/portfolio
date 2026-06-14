using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using NSubstitute;
using Portfolio.Api.AI.Controllers;
using Portfolio.Application.AI;
using Portfolio.Application.AI.Services;
using Portfolio.Application.Analytics.Services;
using Portfolio.Domain.Analytics;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit.Api.Controllers;

public class AiControllerTests
{
    private readonly IAiChatService _chatServiceMock = Substitute.For<IAiChatService>();
    private readonly IAiPromptService _promptServiceMock = Substitute.For<IAiPromptService>();
    private readonly IAnalyticsService _analyticsServiceMock = Substitute.For<IAnalyticsService>();
    private readonly IConfiguration _configMock = Substitute.For<IConfiguration>();
    private readonly AiController _controller;

    public AiControllerTests()
    {
        _controller = new AiController(
            _chatServiceMock,
            _promptServiceMock,
            _analyticsServiceMock,
            _configMock);

        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");
        httpContext.Request.Headers["User-Agent"] = "TestAgent";
        
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    [Fact]
    public async Task ChatAsync_LogsQueryAndStreamsResponse()
    {
        // Arrange
        var request = new AiChatRequest { Message = "Hello" };
        _promptServiceMock.BuildResumeSystemPromptAsync().Returns("System Prompt");
        _configMock["AI_PROVIDER"].Returns("TestProvider");

        // Use a real async enumerable to mock the stream
        async IAsyncEnumerable<string> MockStream()
        {
            yield return "Chunk 1 ";
            yield return "Chunk 2";
            await Task.CompletedTask;
        }

        _chatServiceMock.AskQuestionStreamAsync("System Prompt", "Hello", Arg.Any<CancellationToken>())
            .Returns(MockStream());

        // Act
        await _controller.ChatAsync(request, CancellationToken.None);

        // Assert
        await _analyticsServiceMock.Received(1).LogAiQueryAsync(Arg.Is<AiQueryLog>(log => 
            log.QueryText == "Hello" && log.Provider == "TestProvider"));
            
        _controller.HttpContext.Response.ContentType.ShouldBe("text/event-stream");
    }
}
