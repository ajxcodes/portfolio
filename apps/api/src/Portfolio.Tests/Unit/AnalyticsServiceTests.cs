using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NSubstitute;
using Portfolio.Application.Analytics.Repositories;
using Portfolio.Application.Analytics.Services;
using Portfolio.Domain.Analytics;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class AnalyticsServiceTests
{
    private readonly IAnalyticsRepository _repositoryMock = Substitute.For<IAnalyticsRepository>();
    private readonly AnalyticsService _service;

    public AnalyticsServiceTests()
    {
        _service = new AnalyticsService(_repositoryMock);
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
        var log = new LinkClickLog { Id = Guid.NewGuid(), LinkId = Guid.NewGuid() };

        // Act
        await _service.LogLinkClickAsync(log);

        // Assert
        await _repositoryMock.Received(1).LogLinkClickAsync(log);
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

        var recentViews = new List<PageViewLog> { new() { Id = Guid.NewGuid(), ReferrerSource = "A" } };
        var recentClicks = new List<LinkClickLog> { new() { Id = Guid.NewGuid(), ReferrerSource = "B" } };

        _repositoryMock.GetPageViewsAsync(5).Returns(recentViews);
        _repositoryMock.GetLinkClicksAsync(5).Returns(recentClicks);

        // Act
        var summary = await _service.GetSummaryAsync(5);

        // Assert
        summary.ShouldNotBeNull();
        summary.TotalPageViews.ShouldBe(10);
        summary.UniquePageViews.ShouldBe(5);
        summary.TotalLinkClicks.ShouldBe(20);
        summary.UniqueLinkClicks.ShouldBe(8);
        summary.RecentPageViews.Count.ShouldBe(1);
        summary.RecentLinkClicks.Count.ShouldBe(1);
    }
}
