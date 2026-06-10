using System;
using System.IO;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Portfolio.Api.Upload.Controllers;
using Portfolio.Application.Storage.Services;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class UploadControllerTests
{
    private readonly IStorageService _storageServiceMock = Substitute.For<IStorageService>();
    private readonly UploadController _controller;

    public UploadControllerTests()
    {
        _controller = new UploadController(_storageServiceMock);
    }

    [Fact]
    public async Task UploadAsync_ReturnsBadRequest_WhenFileIsEmpty()
    {
        // Arrange
        var fileMock = Substitute.For<IFormFile>();
        fileMock.Length.Returns(0);

        // Act
        var result = await _controller.UploadAsync(fileMock);

        // Assert
        var badRequestResult = result.ShouldBeOfType<BadRequestObjectResult>();
        badRequestResult.Value.ShouldBe("No file was uploaded");
    }

    [Fact]
    public async Task UploadAsync_ReturnsBadRequest_WhenFileSizeExceedsLimit()
    {
        // Arrange
        var fileMock = Substitute.For<IFormFile>();
        fileMock.Length.Returns(6 * 1024 * 1024); // 6 MB

        // Act
        var result = await _controller.UploadAsync(fileMock);

        // Assert
        var badRequestResult = result.ShouldBeOfType<BadRequestObjectResult>();
        badRequestResult.Value.ShouldBe("File size exceeds the 5MB limit");
    }

    [Fact]
    public async Task UploadAsync_ReturnsBadRequest_WhenExtensionIsInvalid()
    {
        // Arrange
        var fileMock = Substitute.For<IFormFile>();
        fileMock.Length.Returns(1024);
        fileMock.FileName.Returns("exploit.exe");
        fileMock.ContentType.Returns("application/octet-stream");

        // Act
        var result = await _controller.UploadAsync(fileMock);

        // Assert
        var badRequestResult = result.ShouldBeOfType<BadRequestObjectResult>();
        badRequestResult.Value.ShouldBe("Invalid image format. Allowed formats: JPEG, PNG, WEBP, GIF");
    }

    [Fact]
    public async Task UploadAsync_ReturnsOk_WhenUploadIsSuccessful()
    {
        // Arrange
        var fileMock = Substitute.For<IFormFile>();
        fileMock.Length.Returns(100);
        fileMock.FileName.Returns("avatar.png");
        fileMock.ContentType.Returns("image/png");
        var memoryStream = new MemoryStream(new byte[100]);
        fileMock.OpenReadStream().Returns(memoryStream);

        _storageServiceMock.UploadFileAsync(Arg.Any<Stream>(), Arg.Any<string>(), "image/png")
            .Returns("http://localhost:9000/portfolio-media/mock-object-key.png");

        // Act
        var result = await _controller.UploadAsync(fileMock);

        // Assert
        var okResult = result.ShouldBeOfType<OkObjectResult>();
        
        // Assert anonymous type property "Url" using reflection or JSON serialization checking
        var urlProperty = okResult.Value?.GetType().GetProperty("Url");
        urlProperty.ShouldNotBeNull();
        var urlValue = urlProperty.GetValue(okResult.Value) as string;
        urlValue.ShouldBe("http://localhost:9000/portfolio-media/mock-object-key.png");

        await _storageServiceMock.Received(1).UploadFileAsync(Arg.Any<Stream>(), Arg.Any<string>(), "image/png");
    }

    [Fact]
    public async Task UploadAsync_Returns500_WhenStorageServiceThrows()
    {
        // Arrange
        var fileMock = Substitute.For<IFormFile>();
        fileMock.Length.Returns(100);
        fileMock.FileName.Returns("avatar.png");
        fileMock.ContentType.Returns("image/png");
        var memoryStream = new MemoryStream(new byte[100]);
        fileMock.OpenReadStream().Returns(memoryStream);

        _storageServiceMock.UploadFileAsync(Arg.Any<Stream>(), Arg.Any<string>(), "image/png")
            .Throws(new Exception("S3 Upload Failed"));

        // Act
        var result = await _controller.UploadAsync(fileMock);

        // Assert
        var statusResult = result.ShouldBeOfType<ObjectResult>();
        statusResult.StatusCode.ShouldBe(500);
        statusResult.Value.ShouldBe("Internal server error uploading file: S3 Upload Failed");
    }
}
