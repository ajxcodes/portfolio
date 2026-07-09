using System.Text.Json;
using Portfolio.Application.AI.Models;

namespace Portfolio.Application.AI.Services;

public class JobFitService(
    IAiChatService aiChatService,
    IAiPromptService aiPromptService,
    IJobDescriptionExtractionService extractionService) : IJobFitService
{
    public async Task<JobFitAnalysisResponse?> AnalyzeJobFitAsync(JobFitUploadRequest request, CancellationToken cancellationToken)
    {
        // 1. Extract the text
        var jobDescription = await extractionService.ExtractJobDescriptionAsync(request);

        if (string.IsNullOrWhiteSpace(jobDescription))
        {
            return null; // Or throw a specific exception if preferred
        }

        // 2. Build the strict AI prompt
        var systemPrompt = await aiPromptService.BuildJobFitSystemPromptAsync(jobDescription);

        // 3. Query the AI Model (we want a structured JSON response)
        var aiResponseString = await aiChatService.AskQuestionAsync(systemPrompt, "Please analyze the provided job description and return the JSON response.", cancellationToken);
        
        aiResponseString = aiResponseString.Trim();
        if (aiResponseString.StartsWith("```json"))
        {
            aiResponseString = aiResponseString.Substring(7);
        }
        if (aiResponseString.StartsWith("```"))
        {
            aiResponseString = aiResponseString.Substring(3);
        }
        if (aiResponseString.EndsWith("```"))
        {
            aiResponseString = aiResponseString.Substring(0, aiResponseString.Length - 3);
        }

        // 4. Deserialize and return
        return JsonSerializer.Deserialize<JobFitAnalysisResponse>(
            aiResponseString.Trim(), 
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );
    }
}
