using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Portfolio.Application.AI.Models;
using Portfolio.Application.AI.Services;
using Portfolio.Application.Analytics.Services;
using Portfolio.Domain.Analytics;

namespace Portfolio.Api.AI.Controllers;

public class JobFitAnalyzeApiRequest
{
    public string? RawText { get; set; }
    public string? Url { get; set; }
    public IFormFile? File { get; set; }
    public Guid? VisitorSessionId { get; set; }
}

[ApiController]
[Route("api/ai/job-fit")]
public class JobFitController(IJobFitService jobFitService, IAnalyticsService analyticsService, IConfiguration configuration) : ControllerBase
{
    [HttpPost("analyze")]
    [AllowAnonymous]
    [EnableRateLimiting("AiChatPolicy")]
    public async Task<IActionResult> AnalyzeJobFitAsync([FromForm] JobFitAnalyzeApiRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RawText) && string.IsNullOrWhiteSpace(request.Url) && request.File == null)
        {
            return BadRequest("A job description must be provided via RawText, Url, or File.");
        }

        try
        {
            var appRequest = new JobFitUploadRequest
            {
                RawText = request.RawText,
                Url = request.Url,
                FileName = request.File?.FileName
            };

            JobFitAnalysisResponse? analysisResponse;

            if (request.File != null)
            {
                using var memoryStream = new MemoryStream();
                await request.File.CopyToAsync(memoryStream, cancellationToken);
                memoryStream.Position = 0;
                appRequest.FileStream = memoryStream;
                
                analysisResponse = await jobFitService.AnalyzeJobFitAsync(appRequest, cancellationToken);
            }
            else
            {
                analysisResponse = await jobFitService.AnalyzeJobFitAsync(appRequest, cancellationToken);
            }

            if (analysisResponse == null)
            {
                return BadRequest("Could not extract any text from the provided job description source or parsing failed.");
            }

            var sourceStr = !string.IsNullOrWhiteSpace(request.Url) ? $"URL: {request.Url}" : "pasted text or file";
            var company = analysisResponse.Company != "Unknown Company" && !string.IsNullOrWhiteSpace(analysisResponse.Company) ? analysisResponse.Company : null;
            var role = analysisResponse.Role != "Unknown Role" && !string.IsNullOrWhiteSpace(analysisResponse.Role) ? analysisResponse.Role : null;
            
            var companyRoleParts = new List<string>();
            if (company != null) companyRoleParts.Add(company);
            if (role != null) companyRoleParts.Add(role);
            var companyRoleStr = companyRoleParts.Count > 0 ? $" ({string.Join(" - ", companyRoleParts)})" : "";

            var queryLog = new AiQueryLog
            {
                Id = Guid.CreateVersion7(),
                VisitorSessionId = request.VisitorSessionId,
                QueryText = $"Analyzed Job Fit via {sourceStr}{companyRoleStr}",
                Provider = configuration["AI_PROVIDER"] ?? "Unknown",
                QueriedAt = DateTime.UtcNow
            };
            await analyticsService.LogAiQueryAsync(queryLog);

            return Ok(analysisResponse);
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, $"An error occurred during analysis: {ex.Message}");
        }
    }
}
