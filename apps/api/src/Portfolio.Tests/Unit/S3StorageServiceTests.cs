using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Model;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Portfolio.Infrastructure.Storage.Services;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class S3StorageServiceTests
{
    private readonly IAmazonS3 _s3ClientMock = Substitute.For<IAmazonS3>();
    private readonly S3StorageService _service;

    public S3StorageServiceTests()
    {
        _service = new S3StorageService(_s3ClientMock);
    }

    [Fact]
    public async Task UploadFileAsync_UploadsAndReturnsUrl()
    {
        // Arrange
        var stream = new MemoryStream(Encoding.UTF8.GetBytes("test content"));
        var fileName = "test.txt";
        var contentType = "text/plain";
        
        // Mock DoesS3BucketExistV2Async by mocking GetBucketLocationAsync
        _s3ClientMock.GetBucketLocationAsync(Arg.Any<GetBucketLocationRequest>(), Arg.Any<CancellationToken>())
            .Returns(new GetBucketLocationResponse { HttpStatusCode = HttpStatusCode.OK });

        _s3ClientMock.PutObjectAsync(Arg.Any<PutObjectRequest>(), Arg.Any<CancellationToken>())
            .Returns(new PutObjectResponse { HttpStatusCode = HttpStatusCode.OK });

        // Act
        var result = await _service.UploadFileAsync(stream, fileName, contentType);

        // Assert
        result.ShouldNotBeNull();
        result.ShouldContain(".txt");
        await _s3ClientMock.Received(1).PutObjectAsync(Arg.Any<PutObjectRequest>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetFileUrlIfExistsAsync_ReturnsUrl_WhenFileExists()
    {
        // Arrange
        var key = "existing-file.png";
        _s3ClientMock.GetObjectMetadataAsync(Arg.Any<string>(), key, Arg.Any<CancellationToken>())
            .Returns(new GetObjectMetadataResponse { HttpStatusCode = HttpStatusCode.OK });

        // Act
        var result = await _service.GetFileUrlIfExistsAsync(key);

        // Assert
        result.ShouldNotBeNull();
        result.ShouldContain(key);
    }

    [Fact]
    public async Task GetFileUrlIfExistsAsync_ReturnsNull_WhenFileDoesNotExist()
    {
        // Arrange
        var key = "nonexistent.png";
        var s3Exception = new AmazonS3Exception("Not Found") { StatusCode = HttpStatusCode.NotFound };
        _s3ClientMock.GetObjectMetadataAsync(Arg.Any<string>(), key, Arg.Any<CancellationToken>())
            .ThrowsAsync(s3Exception);

        // Act
        var result = await _service.GetFileUrlIfExistsAsync(key);

        // Assert
        result.ShouldBeNull();
    }
}
