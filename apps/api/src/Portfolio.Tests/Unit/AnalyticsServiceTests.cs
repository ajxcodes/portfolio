using Microsoft.Extensions.Logging;
using NSubstitute;
using Portfolio.Application.Analytics.Repositories;
using Portfolio.Application.Analytics.Services;
using Portfolio.Application.Resume.Repositories;
using Portfolio.Domain.Analytics;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class AnalyticsServiceTests
{
    private readonly IAnalyticsRepository _repositoryMock = Substitute.For<IAnalyticsRepository>();
    private readonly IResumeRepository _resumeRepositoryMock = Substitute.For<IResumeRepository>();
    private readonly ILogger<AnalyticsService> _loggerMock = Substitute.For<ILogger<AnalyticsService>>();
    private readonly AnalyticsService _service;

    public AnalyticsServiceTests()
    {
        _service = new AnalyticsService(_repositoryMock, _resumeRepositoryMock, _loggerMock);
    }

    [Fact]
    public async Task LogPageViewAsync_SavesRecord()
    {
        // Arrange
        var log = new PageViewLog { Id = Guid.NewGuid(), ReferrerSource = "Google" };

        // Act
        await _service.LogPageViewAsync(log);

        // Assert
        await _repositoryMock.Received(1).LogPageViewAsync(log);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task LogLinkClickAsync_SavesRecord()
    {
        // Arrange
        var linkId = Guid.NewGuid();
        var log = new LinkClickLog { Id = Guid.NewGuid(), LinkId = linkId };
        var mockLink = new Portfolio.Domain.Resume.ResumeProfileLink 
        { 
            Id = linkId, 
            Url = "https://example.com", 
            LinkType = new Portfolio.Domain.Resume.ResumeProfileLinkType { Name = "Twitter" } 
        };
        _resumeRepositoryMock.GetLinkByIdAsync(linkId).Returns(mockLink);

        // Act
        await _service.LogLinkClickAsync(log);

        // Assert
        log.TargetUrl.ShouldBe("https://example.com");
        log.LinkTypeName.ShouldBe("Twitter");
        await _repositoryMock.Received(1).LogLinkClickAsync(log);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task LogAiQueryAsync_SavesRecord()
    {
        // Arrange
        var log = new AiQueryLog { Id = Guid.NewGuid(), QueryText = "Hello" };

        // Act
        await _service.LogAiQueryAsync(log);

        // Assert
        await _repositoryMock.Received(1).LogAiQueryAsync(log);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task GetOrCreateVisitorSessionAsync_CallsRepositoryAndSaves()
    {
        // Arrange
        var trackingId = "test_hash";
        var expectedSession = new VisitorSession { Id = Guid.NewGuid(), TrackingId = trackingId };
        _repositoryMock.GetOrCreateVisitorSessionAsync(trackingId).Returns(expectedSession);

        // Act
        var result = await _service.GetOrCreateVisitorSessionAsync(trackingId);

        // Assert
        result.ShouldBe(expectedSession);
        await _repositoryMock.Received(1).GetOrCreateVisitorSessionAsync(trackingId);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task GetSummaryAsync_CalculatesAndReturnsAggregateDto()
    {
        // Arrange
        _repositoryMock.GetTotalPageViewsCountAsync().Returns(10);
        _repositoryMock.GetUniquePageViewsCountAsync().Returns(5);
        _repositoryMock.GetTotalLinkClicksCountAsync().Returns(20);
        _repositoryMock.GetUniqueLinkClicksCountAsync().Returns(8);
        _repositoryMock.GetTotalAiQueriesCountAsync().Returns(15);
        _repositoryMock.GetUniqueAiQueriesCountAsync().Returns(7);

        var recentViews = new List<PageViewLog> { new() { Id = Guid.NewGuid(), ReferrerSource = "A", PagePath = "/resume" } };
        var recentClicks = new List<LinkClickLog> { new() { Id = Guid.NewGuid(), ReferrerSource = "B" } };
        var recentAiQueries = new List<AiQueryLog> { new() { Id = Guid.NewGuid(), QueryText = "Q" } };

        _repositoryMock.GetPageViewsAsync(5).Returns(recentViews);
        _repositoryMock.GetLinkClicksAsync(5).Returns(recentClicks);
        _repositoryMock.GetAiQueriesAsync(5).Returns(recentAiQueries);

        // Act
        var summary = await _service.GetSummaryAsync(5);

        // Assert
        summary.ShouldNotBeNull();
        summary.TotalPageViews.ShouldBe(10);
        summary.UniquePageViews.ShouldBe(5);
        summary.TotalLinkClicks.ShouldBe(20);
        summary.UniqueLinkClicks.ShouldBe(8);
        summary.TotalAiQueries.ShouldBe(15);
        summary.UniqueAiQueries.ShouldBe(7);
        summary.RecentPageViews.Count.ShouldBe(1);
        summary.RecentPageViews[0].PagePath.ShouldBe("/resume");
        summary.RecentLinkClicks.Count.ShouldBe(1);
        summary.RecentAiQueries.Count.ShouldBe(1);
    }

    [Fact]
    public async Task LogLinkClickAsync_DoesNotSaveRecord_WhenLinkDoesNotExist()
    {
        // Arrange
        var linkId = Guid.NewGuid();
        var log = new LinkClickLog { Id = Guid.NewGuid(), LinkId = linkId };
        _resumeRepositoryMock.GetLinkByIdAsync(linkId).Returns((Portfolio.Domain.Resume.ResumeProfileLink?)null);

        // Act
        await _service.LogLinkClickAsync(log);

        // Assert
        _loggerMock.Received(1).Log(
            LogLevel.Warning,
            Arg.Any<EventId>(),
            Arg.Is<object>(o => o != null && o.ToString()!.Contains("Link click received for missing LinkId")),
            null,
            Arg.Any<Func<object, Exception, string>>()!);
        
        await _repositoryMock.DidNotReceive().LogLinkClickAsync(Arg.Any<LinkClickLog>());
        await _repositoryMock.DidNotReceive().SaveChangesAsync();
    }

    [Fact]
    public async Task LogLinkClickAsync_SavesRecord_WhenLinkIdIsNull()
    {
        // Arrange
        var log = new LinkClickLog { Id = Guid.NewGuid(), LinkId = null };

        // Act
        await _service.LogLinkClickAsync(log);

        // Assert
        await _resumeRepositoryMock.DidNotReceive().GetLinkByIdAsync(Arg.Any<Guid>());
        await _repositoryMock.Received(1).LogLinkClickAsync(log);
        await _repositoryMock.Received(1).SaveChangesAsync();
    }

    [Fact]
    public async Task LogLinkClickAsync_StripsNewlinesFromUrlAndTypeName()
    {
        // Arrange
        var linkId = Guid.NewGuid();
        var log = new LinkClickLog { Id = Guid.NewGuid(), LinkId = linkId };
        var mockLink = new Portfolio.Domain.Resume.ResumeProfileLink 
        { 
            Id = linkId, 
            Url = "https://\r\nexample\t.com", 
            LinkType = new Portfolio.Domain.Resume.ResumeProfileLinkType { Name = "Twit\r\nter" } 
        };
        _resumeRepositoryMock.GetLinkByIdAsync(linkId).Returns(mockLink);

        // Act
        await _service.LogLinkClickAsync(log);

        // Assert
        log.TargetUrl.ShouldBe("https://example.com");
        log.LinkTypeName.ShouldBe("Twitter");
        await _repositoryMock.Received(1).LogLinkClickAsync(log);
    }

    [Fact]
    public async Task LogLinkClickAsync_HandlesNullUrlAndLinkType()
    {
        // Arrange
        var linkId = Guid.NewGuid();
        var log = new LinkClickLog { Id = Guid.NewGuid(), LinkId = linkId };
        var mockLink = new Portfolio.Domain.Resume.ResumeProfileLink 
        { 
            Id = linkId, 
            Url = null!, 
            LinkType = null! 
        };
        _resumeRepositoryMock.GetLinkByIdAsync(linkId).Returns(mockLink);

        // Act
        await _service.LogLinkClickAsync(log);

        // Assert
        log.TargetUrl.ShouldBe("");
        log.LinkTypeName.ShouldBe("");
        await _repositoryMock.Received(1).LogLinkClickAsync(log);
    }
}
