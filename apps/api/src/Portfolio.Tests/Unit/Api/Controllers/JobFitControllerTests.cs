using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using Portfolio.Api.AI.Controllers;
using Portfolio.Application.AI.Models;
using Portfolio.Application.AI.Services;
using Portfolio.Application.Analytics.Services;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit.Api.Controllers;

public class JobFitControllerTests
{
    private readonly IJobFitService _jobFitServiceMock = Substitute.For<IJobFitService>();
    private readonly IAnalyticsService _analyticsServiceMock = Substitute.For<IAnalyticsService>();
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configurationMock = Substitute.For<Microsoft.Extensions.Configuration.IConfiguration>();
    
    private readonly JobFitController _controller;

    public JobFitControllerTests()
    {
        _configurationMock["AI_PROVIDER"].Returns("TestProvider");
        _controller = new JobFitController(_jobFitServiceMock, _analyticsServiceMock, _configurationMock);
    }

    [Fact]
    public async Task AnalyzeJobFitAsync_WithNoInput_ReturnsBadRequest()
    {
        // Arrange
        var request = new JobFitAnalyzeApiRequest();

        // Act
        var result = await _controller.AnalyzeJobFitAsync(request, CancellationToken.None);

        // Assert
        result.ShouldBeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task AnalyzeJobFitAsync_WithValidText_ReturnsAnalysis()
    {
        // Arrange
        var request = new JobFitAnalyzeApiRequest { RawText = "C# Developer" };
        var aiResponse = new JobFitAnalysisResponse 
        { 
            Company = "TestCompany",
            Role = "TestRole",
            MatchScore = 85, 
            GrowthOpportunities = ["Docker"], 
            ActionChips = ["Hire"] 
        };

        _jobFitServiceMock.AnalyzeJobFitAsync(Arg.Any<JobFitUploadRequest>(), CancellationToken.None).Returns(aiResponse);

        // Act
        var result = await _controller.AnalyzeJobFitAsync(request, CancellationToken.None);

        // Assert
        var okResult = result.ShouldBeOfType<OkObjectResult>();
        var analysis = okResult.Value.ShouldBeOfType<JobFitAnalysisResponse>();
        analysis.MatchScore.ShouldBe(85);
        analysis.GrowthOpportunities.ShouldContain("Docker");
        analysis.ActionChips.ShouldContain("Hire");

        await _analyticsServiceMock.Received(1).LogAiQueryAsync(Arg.Is<Portfolio.Domain.Analytics.AiQueryLog>(log => 
            log.QueryText == "Analyzed Job Fit via pasted text or file (TestCompany - TestRole)" && 
            log.Provider == "TestProvider"));
    }

    [Fact]
    public async Task AnalyzeJobFitAsync_WhenServiceReturnsNull_ReturnsBadRequest()
    {
        // Arrange
        var request = new JobFitAnalyzeApiRequest { RawText = "C# Developer" };

        _jobFitServiceMock.AnalyzeJobFitAsync(Arg.Any<JobFitUploadRequest>(), CancellationToken.None).Returns((JobFitAnalysisResponse?)null);

        // Act
        var result = await _controller.AnalyzeJobFitAsync(request, CancellationToken.None);

        // Assert
        result.ShouldBeOfType<BadRequestObjectResult>();
    }
}
