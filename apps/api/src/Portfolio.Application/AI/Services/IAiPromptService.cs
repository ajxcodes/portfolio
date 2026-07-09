namespace Portfolio.Application.AI.Services;

public interface IAiPromptService
{
    Task<string> BuildResumeSystemPromptAsync();
    Task<string> BuildJobFitSystemPromptAsync(string jobDescription);
}
