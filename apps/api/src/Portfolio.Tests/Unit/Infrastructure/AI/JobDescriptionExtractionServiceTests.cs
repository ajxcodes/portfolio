using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using NSubstitute;
using Portfolio.Application.AI.Models;
using Portfolio.Infrastructure.AI;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit.Infrastructure.AI;

public class JobDescriptionExtractionServiceTests
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly HttpMessageHandler _httpMessageHandler;
    private readonly JobDescriptionExtractionService _service;

    public JobDescriptionExtractionServiceTests()
    {
        _configuration = Substitute.For<IConfiguration>();
        
        var configSection = Substitute.For<IConfigurationSection>();
        configSection.Value.Returns("5242880"); // 5MB
        _configuration.GetSection("MAX_JOB_FIT_FILE_SIZE").Returns(configSection);

        _httpMessageHandler = Substitute.ForPartsOf<MockHttpMessageHandler>();
        _httpClient = new HttpClient(_httpMessageHandler);

        _service = new JobDescriptionExtractionService(_httpClient, _configuration);
    }

    [Fact]
    public async Task ExtractJobDescriptionAsync_WithRawText_ReturnsRawText()
    {
        // Arrange
        var request = new JobFitUploadRequest { RawText = "Sample Job Text" };

        // Act
        var result = await _service.ExtractJobDescriptionAsync(request);

        // Assert
        result.ShouldBe("Sample Job Text");
    }

    [Theory]
    [InlineData("ftp://example.com/job.txt")]
    [InlineData("invalid-url")]
    public async Task ExtractJobDescriptionAsync_WithInvalidUrl_ThrowsArgumentException(string url)
    {
        // Arrange
        var request = new JobFitUploadRequest { Url = url };

        // Act & Assert
        await Should.ThrowAsync<ArgumentException>(() => _service.ExtractJobDescriptionAsync(request));
    }

    [Fact]
    public async Task ExtractJobDescriptionAsync_WithNoSource_ThrowsArgumentException()
    {
        // Arrange
        var request = new JobFitUploadRequest();

        // Act & Assert
        await Should.ThrowAsync<ArgumentException>(() => _service.ExtractJobDescriptionAsync(request));
    }

    [Fact]
    public async Task ExtractFromFileAsync_WithUnsupportedExtension_ThrowsNotSupportedException()
    {
        // Arrange
        var stream = new MemoryStream(new byte[] { 0x00 });
        var request = new JobFitUploadRequest { FileStream = stream, FileName = "test.unknown" };

        // Act & Assert
        await Should.ThrowAsync<NotSupportedException>(() => _service.ExtractJobDescriptionAsync(request));
    }

    [Fact]
    public async Task ExtractFromFileAsync_WithTxtExtension_ReturnsContent()
    {
        // Arrange
        var text = "Sample Text File Content";
        var stream = new MemoryStream(Encoding.UTF8.GetBytes(text));
        var request = new JobFitUploadRequest { FileStream = stream, FileName = "test.txt" };

        // Act
        var result = await _service.ExtractJobDescriptionAsync(request);

        // Assert
        result.ShouldBe(text);
    }

    [Fact]
    public async Task ExtractFromFileAsync_WithPdfExtension_InvalidMagicBytes_ThrowsArgumentException()
    {
        // Arrange
        var stream = new MemoryStream(new byte[] { 0x00, 0x00, 0x00, 0x00, 0x00 });
        var request = new JobFitUploadRequest { FileStream = stream, FileName = "test.pdf" };

        // Act & Assert
        await Should.ThrowAsync<ArgumentException>(() => _service.ExtractJobDescriptionAsync(request));
    }

    [Fact]
    public async Task ExtractFromFileAsync_WithDocxExtension_InvalidMagicBytes_ThrowsArgumentException()
    {
        // Arrange
        var stream = new MemoryStream(new byte[] { 0x00, 0x00, 0x00, 0x00, 0x00 });
        var request = new JobFitUploadRequest { FileStream = stream, FileName = "test.docx" };

        // Act & Assert
        await Should.ThrowAsync<ArgumentException>(() => _service.ExtractJobDescriptionAsync(request));
    }

    // Mock HttpMessageHandler to avoid actual network calls during tests
    public class MockHttpMessageHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("Mocked Response Content")
            };
            return Task.FromResult(response);
        }
    }
}
