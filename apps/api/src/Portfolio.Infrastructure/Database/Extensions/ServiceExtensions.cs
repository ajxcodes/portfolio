using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.Application.Blog.Repositories;
using Portfolio.Infrastructure.Database.Contexts;
using Portfolio.Infrastructure.Database.Repositories;

namespace Portfolio.Infrastructure.Database.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection
        ConfigureDatabase(this IServiceCollection services, IConfiguration configuration) =>
        services.AddDbContext<PortfolioDbContext>(options =>
                options.UseNpgsql(GetConnectionString()))
            .ConfigureRepositories();

    private static IServiceCollection ConfigureRepositories(this IServiceCollection services)
    {
        return services.AddScoped<IPostRepository, PostRepository>();
    }

    private static string GetConnectionString()
    {
        var dbHost = Environment.GetEnvironmentVariable("DB_HOST");
        var dbName = Environment.GetEnvironmentVariable("DB_NAME");
        var dbUser = Environment.GetEnvironmentVariable("DB_USER");
        var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");
        return $"Host={dbHost};Database={dbName};Username={dbUser};Password={dbPassword}";
    }
}