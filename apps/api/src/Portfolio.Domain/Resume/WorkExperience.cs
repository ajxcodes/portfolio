namespace Portfolio.Domain.Resume;

public class WorkExperience
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid ProfileId { get; set; }
    public string Company { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string? Location { get; set; }
    public bool IsPrevious { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;

    // Navigation properties
    public virtual ResumeProfile? Profile { get; set; }
    public virtual ICollection<ExperienceHighlight> Highlights { get; set; } = new List<ExperienceHighlight>();
    public virtual ICollection<WorkExperienceSkill> WorkExperienceSkills { get; set; } = new List<WorkExperienceSkill>();
}
