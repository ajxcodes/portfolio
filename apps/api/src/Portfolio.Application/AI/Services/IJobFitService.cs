using Portfolio.Application.AI.Models;

namespace Portfolio.Application.AI.Services;

public interface IJobFitService
{
    Task<JobFitAnalysisResponse?> AnalyzeJobFitAsync(JobFitUploadRequest request, CancellationToken cancellationToken);
}
