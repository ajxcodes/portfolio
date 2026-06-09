using System.Runtime.InteropServices;
using Portfolio.Infrastructure.Storage.Services;
using Shouldly;
using Testcontainers.Minio;
using Xunit;

namespace Portfolio.Tests.Integration;

public class S3StorageIntegrationTests : IAsyncLifetime
{
    private MinioContainer _minioContainer = null!;

    [DllImport("libc", EntryPoint = "getuid")]
    private static extern uint GetUid();

    public async Task InitializeAsync()
    {
        ConfigureDockerHostForPodman();

        _minioContainer = new MinioBuilder("minio/minio")
            .WithUsername("minioadmin")
            .WithPassword("minioadminpassword")
            .Build();

        await _minioContainer.StartAsync();
    }

    public async Task DisposeAsync()
    {
        await _minioContainer.DisposeAsync();
    }

    [Fact]
    public async Task UploadFileAsync_ShouldSuccessfullyUploadFileToMinio_AndReturnAccessibleUrl()
    {
        // Arrange
        var endpoint = _minioContainer.GetConnectionString();
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

    private void ConfigureDockerHostForPodman()
    {
        if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DOCKER_HOST")))
        {
            return;
        }

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
        {
            try
            {
                var uid = GetUid();
                var podmanSocketPath = $"/run/user/{uid}/podman/podman.sock";
                if (File.Exists(podmanSocketPath))
                {
                    Environment.SetEnvironmentVariable("DOCKER_HOST", $"unix://{podmanSocketPath}");
                }
            }
            catch
            {
                // Graceful fallback
            }
        }
    }
}
