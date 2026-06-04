using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.Application.Blog.Repositories;
using Portfolio.Application.Resume.Repositories;
using Portfolio.Application.Analytics.Repositories;
using Portfolio.Application.Audit.Repositories;
using Portfolio.Infrastructure.Database.Contexts;
using Portfolio.Infrastructure.Database.Repositories;

namespace Portfolio.Infrastructure.Database.Extensions;

public static class ServiceExtensions
{
    const string DbHost = "DB_HOST";
    const string DbName = "DB_NAME";
    const string DbUser = "DB_USER";
    const string DbPassword = "DB_PASSWORD";
    const string IdeDebugging = "IDE_DEBUGGING";
    const string Localhost = "localhost";
    private static readonly string ConnectionString = "Host={0};Database={1};Username={2};Password={3}";
    public static IServiceCollection ConfigureDatabase(this IServiceCollection services)
    {
        services.AddDbContext<PortfolioDbContext>(options =>
                options.UseNpgsql(GetConnectionString()))
            .ConfigureRepositories();
        return services;
    }

    private static IServiceCollection ConfigureRepositories(this IServiceCollection services)
    {
        services.AddScoped<IPostRepository, PostRepository>();
        services.AddScoped<IResumeRepository, ResumeRepository>();
        services.AddScoped<IAnalyticsRepository, AnalyticsRepository>();
        services.AddScoped<IAuditRepository, AuditRepository>();
        return services;
    }

    private static string GetConnectionString()
    {
        var dbHost = GetDbHost();
        var dbName = Environment.GetEnvironmentVariable(DbName);
        var dbUser = Environment.GetEnvironmentVariable(DbUser);
        var dbPassword = Environment.GetEnvironmentVariable(DbPassword);
        return string.Format(ConnectionString, dbHost, dbName, dbUser, dbPassword);
    }

    private static string GetDbHost()
    {
        var envDbHost = Environment.GetEnvironmentVariable(DbHost) ?? Localhost;
        if(!bool.TryParse(Environment.GetEnvironmentVariable(IdeDebugging), out var ideDebugging))
            return envDbHost;
        return ideDebugging ? Localhost : envDbHost;
    }
}