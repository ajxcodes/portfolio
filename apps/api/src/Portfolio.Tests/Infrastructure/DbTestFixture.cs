using System;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.Infrastructure.Database.Contexts;
using Testcontainers.PostgreSql;
using Xunit;

namespace Portfolio.Tests.Infrastructure;

public class DbTestFixture : IAsyncLifetime
{
    public PostgreSqlContainer DbContainer { get; private set; } = null!;
    public WebApplicationFactory<Program> Factory { get; private set; } = null!;

    [DllImport("libc", EntryPoint = "getuid")]
    private static extern uint GetUid();

    public async Task InitializeAsync()
    {
        ConfigureDockerHostForPodman();

        DbContainer = new PostgreSqlBuilder("postgres:15-alpine")
            .Build();

        await DbContainer.StartAsync();

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
        if (DbContainer != null)
        {
            await DbContainer.DisposeAsync();
        }
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
