using Microsoft.Extensions.DependencyInjection;
using Portfolio.Application.Blog.Services;
using Portfolio.Application.Resume.Services;
using Portfolio.Application.Analytics.Services;
using Portfolio.Application.AI.Services;

namespace Portfolio.Application.Extensions;

[System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage]
public static class ServiceExtensions
{
    public static IServiceCollection ConfigureApplication(this IServiceCollection services)
    {
        return services
            .AddScoped<IPostService, PostService>()
            .AddScoped<IResumeService, ResumeService>()
            .AddScoped<IAnalyticsService, AnalyticsService>()
            .AddScoped<IAiPromptService, AiPromptService>()
            .AddSingleton<IResumePdfGenerator, ResumePdfGenerator>();
    }
}