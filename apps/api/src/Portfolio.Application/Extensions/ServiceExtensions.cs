using Microsoft.Extensions.DependencyInjection;
using Portfolio.Application.Content.Services;
using Portfolio.Application.Resume.Services;
using Portfolio.Application.Analytics.Services;
using Portfolio.Application.AI.Services;

namespace Portfolio.Application.Extensions;

[System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage]
public static class ServiceExtensions
{
    public static IServiceCollection ConfigureApplication(this IServiceCollection services)
    {
        services
            .AddScoped<IContentService, ContentService>()
            .AddScoped<IResumeService, ResumeService>()
            .AddScoped<IAnalyticsService, AnalyticsService>()
            .AddScoped<IAiPromptService, AiPromptService>()
            .AddScoped<IJobFitService, JobFitService>();
        
        return services;
    }
}