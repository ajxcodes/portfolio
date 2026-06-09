namespace Portfolio.Domain.Resume;

public class Skill
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid CategoryId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public int DisplayOrder { get; set; } = 0;

    // Navigation properties
    public virtual SkillCategory? Category { get; set; }
    public virtual ICollection<WorkExperienceSkill> WorkExperienceSkills { get; set; } = new List<WorkExperienceSkill>();
}
