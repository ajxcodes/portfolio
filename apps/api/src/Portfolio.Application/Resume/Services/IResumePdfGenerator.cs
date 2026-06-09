using Portfolio.Domain.Resume;

namespace Portfolio.Application.Resume.Services;

public interface IResumePdfGenerator
{
    byte[] GeneratePdf(ResumeProfile profile, List<SkillCategory> skillCategories);
}
