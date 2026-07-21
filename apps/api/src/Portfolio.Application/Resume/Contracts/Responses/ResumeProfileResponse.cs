using System;
using System.Collections.Generic;

namespace Portfolio.Application.Resume.Contracts.Responses;

public class ResumeProfileResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Intro { get; set; } = string.Empty;
    public string PhotoUrlLight { get; set; } = string.Empty;
    public string PhotoUrlDark { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<ResumeProfileLinkResponse> Links { get; set; } = new();
    public List<WorkExperienceResponse> WorkExperiences { get; set; } = new();
}

public class ResumeProfileLinkResponse
{
    public Guid Id { get; set; }
    public Guid ProfileId { get; set; }
    public Guid LinkTypeId { get; set; }
    public string Url { get; set; } = string.Empty;
    public bool DisplayInHeader { get; set; } = true;
    public ResumeLinkTypeResponse? LinkType { get; set; }
}

public class ResumeLinkTypeResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string KeyIdentifier { get; set; } = string.Empty;
}

public class WorkExperienceResponse
{
    public Guid Id { get; set; }
    public Guid ProfileId { get; set; }
    public string Company { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string? Location { get; set; }
    public bool IsPrevious { get; set; }
    public int DisplayOrder { get; set; }

    public List<ExperienceHighlightResponse> Highlights { get; set; } = new();
    public List<WorkExperienceSkillResponse> WorkExperienceSkills { get; set; } = new();
}

public class ExperienceHighlightResponse
{
    public Guid Id { get; set; }
    public Guid ExperienceId { get; set; }
    public string ResultText { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public class WorkExperienceSkillResponse
{
    public Guid WorkExperienceId { get; set; }
    public Guid SkillId { get; set; }
    public SkillResponse? Skill { get; set; }
}

public class SkillCategoryResponse
{
    public Guid Id { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? IconName { get; set; }
    public int DisplayOrder { get; set; }

    public List<SkillResponse> Skills { get; set; } = new();
}

public class SkillResponse
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}
