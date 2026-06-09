using System.Runtime.InteropServices;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.Infrastructure.Database.Contexts;
using Testcontainers.PostgreSql;
using Testcontainers.Minio;
using Xunit;

[assembly: CollectionBehavior(DisableTestParallelization = true)]

namespace Portfolio.Tests.Infrastructure;

public class DbTestFixture : IAsyncLifetime
{
    public PostgreSqlContainer DbContainer { get; private set; } = null!;
    public MinioContainer MinioContainer { get; private set; } = null!;
    public WebApplicationFactory<Program> Factory { get; private set; } = null!;

    [DllImport("libc", EntryPoint = "getuid")]
    private static extern uint GetUid();

    public async Task InitializeAsync()
    {
        ConfigureDockerHostForPodman();

        DbContainer = new PostgreSqlBuilder("postgres:15-alpine")
            .Build();

        MinioContainer = new MinioBuilder("minio/minio")
            .WithUsername("minioadmin")
            .WithPassword("minioadminpassword")
            .Build();

        await Task.WhenAll(DbContainer.StartAsync(), MinioContainer.StartAsync());

        // Set S3 environment variables for integration tests using the local MinIO container
        Environment.SetEnvironmentVariable("S3_ENDPOINT", MinioContainer.GetConnectionString());
        Environment.SetEnvironmentVariable("S3_ACCESS_KEY", "minioadmin");
        Environment.SetEnvironmentVariable("S3_SECRET_KEY", "minioadminpassword");
        Environment.SetEnvironmentVariable("S3_BUCKET_NAME", "test-portfolio-media");
        Environment.SetEnvironmentVariable("S3_PUBLIC_URL", "");
        
        // Set a dummy 32-byte encryption key for AesEncryptionConverter
        Environment.SetEnvironmentVariable("ENCRYPTION_KEY", "12345678901234567890123456789012");

        Factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("LOCAL_DEV_BYPASS_AUTH", "true");
            builder.UseSetting("ADMIN_EMAIL", "admin@example.com");

            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<PortfolioDbContext>));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<PortfolioDbContext>(options =>
                {
                    options.UseNpgsql(DbContainer.GetConnectionString());
                });
            });
        });

        // Initialize schema and tables
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        await context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        if (Factory != null)
        {
            await Factory.DisposeAsync();
        }
        await Task.WhenAll(
            DbContainer != null ? DbContainer.DisposeAsync().AsTask() : Task.CompletedTask,
            MinioContainer != null ? MinioContainer.DisposeAsync().AsTask() : Task.CompletedTask
        );
    }

    private void ConfigureDockerHostForPodman()
    {
        // If DOCKER_HOST is already set, respect it
        if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DOCKER_HOST")))
        {
            return;
        }

        // On Linux, check if rootless Podman socket exists and configure DOCKER_HOST accordingly
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
                // Graceful fallback if libc call fails (e.g. running in an environment without standard libc)
            }
        }
    }
}
