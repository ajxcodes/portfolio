using System.Threading;
using System.Threading.Tasks;
using NSubstitute;
using Portfolio.Application.AI;
using Portfolio.Application.AI.Models;
using Portfolio.Application.AI.Services;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit.Application.AI;

public class JobFitServiceTests
{
    private readonly IAiChatService _aiChatServiceMock = Substitute.For<IAiChatService>();
    private readonly IAiPromptService _aiPromptServiceMock = Substitute.For<IAiPromptService>();
    private readonly IJobDescriptionExtractionService _extractionServiceMock = Substitute.For<IJobDescriptionExtractionService>();
    
    private readonly JobFitService _service;

    public JobFitServiceTests()
    {
        _service = new JobFitService(_aiChatServiceMock, _aiPromptServiceMock, _extractionServiceMock);
    }

    [Fact]
    public async Task AnalyzeJobFitAsync_WhenExtractionFails_ReturnsNull()
    {
        // Arrange
        var request = new JobFitUploadRequest { RawText = "C# Developer" };
        _extractionServiceMock.ExtractJobDescriptionAsync(request).Returns(string.Empty);

        // Act
        var result = await _service.AnalyzeJobFitAsync(request, CancellationToken.None);

        // Assert
        result.ShouldBeNull();
    }

    [Fact]
    public async Task AnalyzeJobFitAsync_WithValidText_ReturnsAnalysis()
    {
        // Arrange
        var request = new JobFitUploadRequest { RawText = "C# Developer" };
        var systemPrompt = "System Prompt";
        var aiResponse = "{ \"MatchScore\": 85, \"GrowthOpportunities\": [\"Docker\"], \"ActionChips\": [\"Hire\"] }";

        _extractionServiceMock.ExtractJobDescriptionAsync(request).Returns("C# Developer");
        _aiPromptServiceMock.BuildJobFitSystemPromptAsync("C# Developer").Returns(systemPrompt);
        _aiChatServiceMock.AskQuestionAsync(systemPrompt, Arg.Any<string>(), CancellationToken.None).Returns(aiResponse);

        // Act
        var result = await _service.AnalyzeJobFitAsync(request, CancellationToken.None);

        // Assert
        result.ShouldNotBeNull();
        result!.MatchScore.ShouldBe(85);
        result.GrowthOpportunities.ShouldContain("Docker");
        result.ActionChips.ShouldContain("Hire");
    }

    [Fact]
    public async Task AnalyzeJobFitAsync_WithMarkdownJson_StripsMarkdownAndReturnsAnalysis()
    {
        // Arrange
        var request = new JobFitUploadRequest { RawText = "C# Developer" };
        var aiResponse = "```json\n{ \"MatchScore\": 50 }\n```";

        _extractionServiceMock.ExtractJobDescriptionAsync(request).Returns("C# Developer");
        _aiChatServiceMock.AskQuestionAsync(Arg.Any<string>(), Arg.Any<string>(), CancellationToken.None).Returns(aiResponse);

        // Act
        var result = await _service.AnalyzeJobFitAsync(request, CancellationToken.None);

        // Assert
        result.ShouldNotBeNull();
        result!.MatchScore.ShouldBe(50);
    }
}
