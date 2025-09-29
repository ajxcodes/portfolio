using Microsoft.Extensions.DependencyInjection;
using Portfolio.Application.Blog.Services;

namespace Portfolio.Application.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection ConfigureApplication(this IServiceCollection services) =>
        services.AddScoped<IPostService, PostService>();
}