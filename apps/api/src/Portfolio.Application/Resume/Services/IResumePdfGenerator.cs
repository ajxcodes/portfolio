using Portfolio.Application.Resume.Contracts.Responses;

namespace Portfolio.Application.Resume.Services;

public interface IResumePdfGenerator
{
    byte[] GeneratePdf(ResumeProfileResponse profile, List<SkillCategoryResponse> skillCategories);
}
