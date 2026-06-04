using Microsoft.Extensions.DependencyInjection;
using Portfolio.Application.Blog.Services;
using Portfolio.Application.Resume.Services;
using Portfolio.Application.Analytics.Services;

namespace Portfolio.Application.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection ConfigureApplication(this IServiceCollection services)
    {
        return services
            .AddScoped<IPostService, PostService>()
            .AddScoped<IResumeService, ResumeService>()
            .AddScoped<IAnalyticsService, AnalyticsService>();
    }
}