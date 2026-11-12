namespace Portfolio.Domain.Content;

/// <summary>
/// Join entity for the many-to-many relationship between a <see cref="BlogPost"/> and a
/// <see cref="Project"/>. The composite key (PostId, ProjectId) mirrors
/// <see cref="ContentTagAssignment"/>, the closest structural analogue in this schema.
/// </summary>
public class PostProject
{
    public Guid PostId { get; set; }
    public Guid ProjectId { get; set; }

    // Navigation properties
    public virtual BlogPost? Post { get; set; }
    public virtual Project? Project { get; set; }
}
