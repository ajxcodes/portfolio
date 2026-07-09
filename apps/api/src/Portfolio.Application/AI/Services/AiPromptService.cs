using System.Text;
using Portfolio.Application.AI.Constants;
using Portfolio.Application.Resume.Services;

namespace Portfolio.Application.AI.Services;

public class AiPromptService(IResumeService resumeService) : IAiPromptService
{
    public async Task<string> BuildResumeSystemPromptAsync()
    {
        var resumeContext = await BuildResumeContextStringAsync();
        return string.Format(AiPrompts.ResumeAssistantSystemPrompt, resumeContext);
    }

    public async Task<string> BuildJobFitSystemPromptAsync(string jobDescription)
    {
        var resumeContext = await BuildResumeContextStringAsync();
        return string.Format(AiPrompts.JobFitAnalyzerSystemPrompt, resumeContext, jobDescription);
    }

    private async Task<string> BuildResumeContextStringAsync()
    {
        var profile = await resumeService.GetActiveProfileAsync();
        var resumeContext = new StringBuilder();

        if (profile != null)
        {
            resumeContext.AppendLine($"Name: {profile.Name}");
            resumeContext.AppendLine($"Title: {profile.Title}");
            resumeContext.AppendLine($"Intro: {profile.Intro}");
            
            if (profile.WorkExperiences.Any())
            {
                resumeContext.AppendLine("Work Experience:");
                foreach (var exp in profile.WorkExperiences.OrderBy(x => x.DisplayOrder))
                {
                    resumeContext.AppendLine($"- {exp.Role} at {exp.Company} ({exp.Period})");
                    if (exp.Highlights.Any())
                    {
                        foreach (var highlight in exp.Highlights.OrderBy(h => h.DisplayOrder))
                        {
                            resumeContext.AppendLine($"  * {highlight.ResultText}");
                        }
                    }
                }
            }
            
            if (profile.Links.Any())
            {
                resumeContext.AppendLine("Profile Links:");
                foreach (var link in profile.Links)
                {
                    resumeContext.AppendLine($"- {link.LinkType?.Name ?? "Link"}: {link.Url}");
                }
            }
            
            var skills = await resumeService.ListSkillsAsync();
            if (skills.Any())
            {
                resumeContext.AppendLine("Skills & Technologies:");
                foreach (var category in skills)
                {
                    var skillNames = string.Join(", ", category.Skills.Select(s => s.SkillName));
                    if (!string.IsNullOrWhiteSpace(skillNames))
                    {
                        resumeContext.AppendLine($"- {category.CategoryName}: {skillNames}");
                    }
                }
            }
        }
        else
        {
            resumeContext.AppendLine("No active resume profile found.");
        }

        return resumeContext.ToString();
    }
}
