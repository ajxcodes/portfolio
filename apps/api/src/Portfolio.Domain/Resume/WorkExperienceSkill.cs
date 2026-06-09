namespace Portfolio.Domain.Resume;

public class WorkExperienceSkill
{
    public Guid WorkExperienceId { get; set; }
    public Guid SkillId { get; set; }

    // Navigation properties
    public virtual WorkExperience? WorkExperience { get; set; }
    public virtual Skill? Skill { get; set; }
}
