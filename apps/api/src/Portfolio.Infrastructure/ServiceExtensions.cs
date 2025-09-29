using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Portfolio.Infrastructure.Database.Extensions;

namespace Portfolio.Infrastructure;

public static class ServiceExtensions
{
    public static IServiceCollection ConfigureInfrastructure(this IServiceCollection services,
        IConfiguration configuration)
    {
        return services.ConfigureDatabase(configuration);
    }
}