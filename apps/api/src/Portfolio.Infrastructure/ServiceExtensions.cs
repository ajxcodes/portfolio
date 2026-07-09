using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.Infrastructure.Database.Contexts;
using Portfolio.Infrastructure.Database.Extensions;

using Portfolio.Application.Storage.Services;
using Portfolio.Infrastructure.Storage.Services;
using Portfolio.Application.AI;
using Portfolio.Infrastructure.AI;

namespace Portfolio.Infrastructure;

[System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage]
public static class ServiceExtensions
{
    public static IServiceCollection ConfigureInfrastructure(this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IStorageService, S3StorageService>();

        var aiProvider = configuration["AI_PROVIDER"] ?? "Ollama";
        if (aiProvider.Equals("Gemini", StringComparison.OrdinalIgnoreCase))
        {
            services.AddHttpClient<IAiChatService, GeminiChatService>();
        }
        else
        {
            services.AddHttpClient<IAiChatService, OllamaChatService>();
        }

        services.AddHttpClient<Application.AI.Services.IJobDescriptionExtractionService, JobDescriptionExtractionService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Clear();
        });

        return services.ConfigureDatabase();
    }

    public static async Task RunMigrations(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        await dbContext.Database.MigrateAsync();
    }
}