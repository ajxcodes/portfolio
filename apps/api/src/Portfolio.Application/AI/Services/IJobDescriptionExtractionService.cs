using Portfolio.Application.AI.Models;

namespace Portfolio.Application.AI.Services;

public interface IJobDescriptionExtractionService
{
    Task<string> ExtractJobDescriptionAsync(JobFitUploadRequest request);
}
