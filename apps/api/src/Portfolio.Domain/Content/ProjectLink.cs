namespace Portfolio.Domain.Content;

public class ProjectLink
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid ProjectId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Label { get; set; }
    public int DisplayOrder { get; set; }

    // Navigation properties
    public virtual Project? Project { get; set; }
}
