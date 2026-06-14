using System.Threading.Tasks;

namespace Portfolio.Application.AI.Services;

public interface IAiPromptService
{
    Task<string> BuildResumeSystemPromptAsync();
}
