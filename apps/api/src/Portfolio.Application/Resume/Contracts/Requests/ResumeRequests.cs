using System;
using System.Collections.Generic;

namespace Portfolio.Application.Resume.Contracts.Requests;

public class ResumeLinkRequest
{
    public string LinkTypeName { get; set; } = string.Empty;
    public string LinkTypeKey { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public bool DisplayInHeader { get; set; } = true;
}

public class WorkExperienceRequest
{
    public string Company { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string? Location { get; set; }
    public bool IsPrevious { get; set; }
    public int DisplayOrder { get; set; }
    public List<string> Highlights { get; set; } = new();
    public List<Guid>? SkillIds { get; set; }
}

public class CreateResumeRequest
{
    public string Name { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Intro { get; init; } = string.Empty;
    public string? PhotoUrlLight { get; init; }
    public string? PhotoUrlDark { get; init; }
    public List<ResumeLinkRequest>? Links { get; set; }
    public List<WorkExperienceRequest>? WorkExperiences { get; set; }
}

public class UpdateResumeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Intro { get; set; } = string.Empty;
    public string? PhotoUrlLight { get; set; }
    public string? PhotoUrlDark { get; set; }
    public List<ResumeLinkRequest>? Links { get; set; }
    public List<WorkExperienceRequest>? WorkExperiences { get; set; }
}

public class CreateSkillCategoryRequest
{
    public string CategoryName { get; set; } = string.Empty;
    public string? IconName { get; set; }
    public int DisplayOrder { get; set; }
}

public class UpdateSkillCategoryRequest
{
    public string CategoryName { get; set; } = string.Empty;
    public string? IconName { get; set; }
    public int DisplayOrder { get; set; }
}

public class CreateSkillRequest
{
    public Guid CategoryId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public class UpdateSkillRequest
{
    public Guid CategoryId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}
