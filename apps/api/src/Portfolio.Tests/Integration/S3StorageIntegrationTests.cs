using System.Runtime.InteropServices;
using Portfolio.Infrastructure.Storage.Services;
using Shouldly;
using Testcontainers.Minio;
using Xunit;
using Portfolio.Tests.Infrastructure;

namespace Portfolio.Tests.Integration;

[Collection("SharedDbCollection")]
public class S3StorageIntegrationTests
{
    private readonly DbTestFixture _fixture;

    public S3StorageIntegrationTests(DbTestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task UploadFileAsync_ShouldSuccessfullyUploadFileToMinio_AndReturnAccessibleUrl()
    {
        // Arrange
        var endpoint = _fixture.MinioContainer.GetConnectionString();
        Environment.SetEnvironmentVariable("S3_ENDPOINT", endpoint);
        Environment.SetEnvironmentVariable("S3_ACCESS_KEY", "minioadmin");
        Environment.SetEnvironmentVariable("S3_SECRET_KEY", "minioadminpassword");
        Environment.SetEnvironmentVariable("S3_BUCKET_NAME", "test-portfolio-media");
        Environment.SetEnvironmentVariable("S3_PUBLIC_URL", "");

        var storageService = new S3StorageService();

        var fileContent = "This is some test image data."u8.ToArray();
        using var stream = new MemoryStream(fileContent);
        var fileName = "test-avatar.png";
        var contentType = "image/png";

        // Act
        var returnedUrl = await storageService.UploadFileAsync(stream, fileName, contentType);

        // Assert
        returnedUrl.ShouldNotBeNullOrEmpty();
        returnedUrl.ShouldContain("test-portfolio-media");
        returnedUrl.ShouldEndWith(".png");

        // Verify we can HTTP fetch the uploaded file from the MinIO container
        using var httpClient = new HttpClient();
        var fetchResponse = await httpClient.GetAsync(returnedUrl);
        fetchResponse.IsSuccessStatusCode.ShouldBeTrue();

        var fetchedBytes = await fetchResponse.Content.ReadAsByteArrayAsync();
        fetchedBytes.ShouldBe(fileContent);
    }
}
