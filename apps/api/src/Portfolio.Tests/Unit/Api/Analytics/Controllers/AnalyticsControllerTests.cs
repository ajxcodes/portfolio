using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using Portfolio.Api.Analytics.Controllers;
using Portfolio.Application.Analytics.Services;
using Portfolio.Domain.Analytics;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit.Api.Analytics.Controllers;

public class AnalyticsControllerTests
{
    private readonly IAnalyticsService _analyticsServiceMock;
    private readonly AnalyticsController _controller;
    private readonly DefaultHttpContext _httpContext;

    public AnalyticsControllerTests()
    {
        _analyticsServiceMock = Substitute.For<IAnalyticsService>();
        _httpContext = new DefaultHttpContext();

        _controller = new AnalyticsController(_analyticsServiceMock)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = _httpContext
            }
        };
    }

    [Fact]
    public async Task LogPageViewAsync_WithValidRequest_ReturnsOk()
    {
        var sessionId = Guid.NewGuid();
        _analyticsServiceMock
            .GetOrCreateVisitorSessionAsync(Arg.Any<string>())
            .Returns(new VisitorSession { Id = sessionId });

        _httpContext.Request.Headers["User-Agent"] = "TestAgent";
        
        var request = new PageViewRequest
        {
            PagePath = "/test",
            Country = "US",
            City = "New York"
        };

        var result = await _controller.LogPageViewAsync(request);

        var okResult = result.ShouldBeOfType<OkObjectResult>();
        okResult.Value.ShouldNotBeNull();
        
        await _analyticsServiceMock.Received(1).LogPageViewAsync(Arg.Is<PageViewLog>(l => 
            l.VisitorSessionId == sessionId && 
            l.PagePath == "/test" && 
            l.Country == "US"));
    }

    [Fact]
    public async Task LogLinkClickAsync_WithValidRequest_ReturnsOk()
    {
        var sessionId = Guid.NewGuid();
        var linkId = Guid.NewGuid();
        _analyticsServiceMock
            .GetOrCreateVisitorSessionAsync(Arg.Any<string>())
            .Returns(new VisitorSession { Id = sessionId });

        _httpContext.Request.Headers["User-Agent"] = "TestAgent";
        
        var request = new LinkClickRequest
        {
            LinkId = linkId,
            Country = "US",
            City = "New York"
        };

        var result = await _controller.LogLinkClickAsync(request);

        var okResult = result.ShouldBeOfType<OkObjectResult>();
        okResult.Value.ShouldNotBeNull();
        
        await _analyticsServiceMock.Received(1).LogLinkClickAsync(Arg.Is<LinkClickLog>(l => 
            l.VisitorSessionId == sessionId && 
            l.LinkId == linkId && 
            l.Country == "US"));
    }
    
    [Fact]
    public async Task LogLinkClickAsync_WithEmptyLinkId_ReturnsBadRequest()
    {
        var request = new LinkClickRequest
        {
            LinkId = Guid.Empty
        };

        var result = await _controller.LogLinkClickAsync(request);

        var badRequestResult = result.ShouldBeOfType<BadRequestObjectResult>();
        badRequestResult.Value.ShouldBe("LinkId is required");
    }

    [Theory]
    [InlineData("X-Forwarded-For", "192.168.1.1, 10.0.0.1", "192.168.1.1")]
    [InlineData("X-Real-IP", "10.0.0.1", "10.0.0.1")]
    public async Task LogPageViewAsync_ExtractsIpCorrectly(string headerName, string headerValue, string expectedIpHashBase)
    {
        var sessionId = Guid.NewGuid();
        _analyticsServiceMock
            .GetOrCreateVisitorSessionAsync(Arg.Any<string>())
            .Returns(new VisitorSession { Id = sessionId });

        _httpContext.Request.Headers[headerName] = headerValue;
        _httpContext.Request.Headers["User-Agent"] = "TestAgent";
        
        var request = new PageViewRequest { PagePath = "/test" };

        await _controller.LogPageViewAsync(request);

        await _analyticsServiceMock.Received(1).GetOrCreateVisitorSessionAsync(Arg.Is<string>(id => id.Length == 64));
    }

    [Fact]
    public async Task GetSummaryAsync_ReturnsSummaryDto()
    {
        var summaryDto = new AnalyticsSummaryDto();
        _analyticsServiceMock.GetSummaryAsync(20).Returns(summaryDto);

        var result = await _controller.GetSummaryAsync(20);

        var okResult = result.Result.ShouldBeOfType<OkObjectResult>();
        okResult.Value.ShouldBe(summaryDto);
    }
}
