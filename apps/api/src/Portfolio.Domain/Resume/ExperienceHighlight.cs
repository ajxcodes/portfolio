namespace Portfolio.Domain.Resume;

public class ExperienceHighlight
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid ExperienceId { get; set; }
    public string ResultText { get; set; } = string.Empty;
    public int DisplayOrder { get; set; } = 0;

    // Navigation property
    public virtual WorkExperience? Experience { get; set; }
}
