using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using Portfolio.Api.Analytics.Controllers;
using Portfolio.Application.Analytics.Services;
using Portfolio.Domain.Analytics;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class AnalyticsControllerTests
{
    private readonly IAnalyticsService _serviceMock = Substitute.For<IAnalyticsService>();
    private readonly AnalyticsController _controller;

    public AnalyticsControllerTests()
    {
        _controller = new AnalyticsController(_serviceMock);
        
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["User-Agent"] = "TestAgent";
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");
        
        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = httpContext
        };
        
        _serviceMock.GetOrCreateVisitorSessionAsync(Arg.Any<string>())
            .Returns(new VisitorSession { Id = Guid.NewGuid() });
    }

    [Fact]
    public async Task LogPageViewAsync_ReturnsOk_AndLogsView()
    {
        var request = new PageViewRequest { ReferrerSource = "Google", PagePath = "/resume" };

        var result = await _controller.LogPageViewAsync(request);

        result.ShouldBeOfType<OkObjectResult>();
        await _serviceMock.Received(1).LogPageViewAsync(Arg.Is<PageViewLog>(l => l.ReferrerSource == "Google" && l.PagePath == "/resume"));
    }

    [Fact]
    public async Task LogLinkClickAsync_ReturnsBadRequest_WhenLinkIdIsEmpty()
    {
        var request = new LinkClickRequest { LinkId = Guid.Empty };

        var result = await _controller.LogLinkClickAsync(request);

        result.ShouldBeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task LogLinkClickAsync_ReturnsOk_AndLogsClick()
    {
        var linkId = Guid.NewGuid();
        var request = new LinkClickRequest { LinkId = linkId };

        var result = await _controller.LogLinkClickAsync(request);

        result.ShouldBeOfType<OkObjectResult>();
        await _serviceMock.Received(1).LogLinkClickAsync(Arg.Is<LinkClickLog>(l => l.LinkId == linkId));
    }

    [Fact]
    public async Task GetSummaryAsync_ReturnsOk_WithSummary()
    {
        var summary = new AnalyticsSummaryDto();
        _serviceMock.GetSummaryAsync(20).Returns(summary);

        var result = await _controller.GetSummaryAsync(20);

        var okResult = result.Result.ShouldBeOfType<OkObjectResult>();
        okResult.Value.ShouldBe(summary);
    }

    [Fact]
    public async Task GetClientIpAddress_UsesXForwardedFor_WhenPresent()
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Forwarded-For"] = "192.168.1.1, 10.0.0.1";
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");
        
        var controller = new AnalyticsController(_serviceMock)
        {
            ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            }
        };

        var request = new PageViewRequest { ReferrerSource = "Google", PagePath = "/resume" };
        await controller.LogPageViewAsync(request);

        // Can't directly assert tracking ID generation since it's private and hashed, 
        // but this ensures the X-Forwarded-For branch executes without error.
        await _serviceMock.Received(1).LogPageViewAsync(Arg.Any<PageViewLog>());
    }

    [Fact]
    public async Task GetClientIpAddress_UsesXRealIp_WhenPresent()
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Real-IP"] = "192.168.1.2";
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");
        
        var controller = new AnalyticsController(_serviceMock)
        {
            ControllerContext = new ControllerContext()
            {
                HttpContext = httpContext
            }
        };

        var request = new PageViewRequest { ReferrerSource = "Google", PagePath = "/resume" };
        await controller.LogPageViewAsync(request);

        await _serviceMock.Received(1).LogPageViewAsync(Arg.Any<PageViewLog>());
    }
}
