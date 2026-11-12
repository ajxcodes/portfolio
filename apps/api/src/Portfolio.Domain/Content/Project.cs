namespace Portfolio.Domain.Content;

public class Project : ContentItem
{
    /// <summary>
    /// The date the project started. Stored on the shared <c>ContentItems</c> base table
    /// (the schema is table-per-hierarchy) and mutable through the dedicated
    /// start-date endpoint so existing projects can be backfilled.
    /// </summary>
    public DateTime? StartDate { get; set; }

    // Navigation properties
    public virtual ICollection<ProjectLink> ProjectLinks { get; set; } = new List<ProjectLink>();

    /// <summary>
    /// The blog posts this project is attached to (inverse side of the join table).
    /// </summary>
    public virtual ICollection<PostProject> PostProjects { get; set; } = new List<PostProject>();
}
