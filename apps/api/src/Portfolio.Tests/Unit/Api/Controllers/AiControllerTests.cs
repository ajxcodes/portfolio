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
    [Fact]
    public async Task ChatAsync_EmptyMessage_ReturnsBadRequest()
    {
        // Arrange
        var request = new AiChatRequest { Message = "" };

        // Act
        await _controller.ChatAsync(request, CancellationToken.None);

        // Assert
        _controller.HttpContext.Response.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ChatAsync_InvalidAcceptHeader_ReturnsNotAcceptable()
    {
        // Arrange
        var request = new AiChatRequest { Message = "Hello" };
        _controller.HttpContext.Request.Headers.Accept = "application/json";

        // Act
        await _controller.ChatAsync(request, CancellationToken.None);

        // Assert
        _controller.HttpContext.Response.StatusCode.ShouldBe(StatusCodes.Status406NotAcceptable);
    }

    [Fact]
    public async Task ChatAsync_OperationCanceledException_GracefullyHandles()
    {
        // Arrange
        var request = new AiChatRequest { Message = "Hello" };
        _controller.HttpContext.Request.Headers.Accept = "text/event-stream";
        _promptServiceMock.BuildResumeSystemPromptAsync().Returns("System Prompt");

        async IAsyncEnumerable<string> MockStream()
        {
            yield return "Chunk";
            throw new OperationCanceledException();
        }

        _chatServiceMock.AskQuestionStreamAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(MockStream());

        // Act
        await _controller.ChatAsync(request, CancellationToken.None);

        // Assert
        // Re-read stream to ensure "event: done" was written
        _controller.HttpContext.Response.Body.Position = 0;
        using var reader = new StreamReader(_controller.HttpContext.Response.Body);
        var responseBody = await reader.ReadToEndAsync();
        
        responseBody.ShouldContain("event: done");
    }

    [Fact]
    public async Task ChatAsync_GenericException_WritesErrorEvent()
    {
        // Arrange
        var request = new AiChatRequest { Message = "Hello" };
        _controller.HttpContext.Request.Headers.Accept = "text/event-stream";
        _promptServiceMock.BuildResumeSystemPromptAsync().Returns("System Prompt");

        async IAsyncEnumerable<string> MockStream()
        {
            yield return "Chunk";
            throw new Exception("Test Exception");
        }

        _chatServiceMock.AskQuestionStreamAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(MockStream());

        // Act
        await _controller.ChatAsync(request, CancellationToken.None);

        // Assert
        _controller.HttpContext.Response.Body.Position = 0;
        using var reader = new StreamReader(_controller.HttpContext.Response.Body);
        var responseBody = await reader.ReadToEndAsync();
        
        responseBody.ShouldContain("event: error");
        responseBody.ShouldContain("Test Exception");
        responseBody.ShouldContain("event: done");
    }
}
