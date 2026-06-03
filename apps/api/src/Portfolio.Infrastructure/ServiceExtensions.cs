using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.Infrastructure.Database.Contexts;
using Portfolio.Infrastructure.Database.Extensions;

namespace Portfolio.Infrastructure;

public static class ServiceExtensions
{
    public static IServiceCollection ConfigureInfrastructure(this IServiceCollection services,
        IConfiguration configuration)
    {
        return services.ConfigureDatabase();
    }

    public static async Task RunMigrations(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
        await dbContext.Database.MigrateAsync();
    }
}