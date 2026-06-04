using System;

namespace Portfolio.Domain.Blog;

public class PostTag
{
    public Guid PostId { get; set; }
    public Guid TagId { get; set; }

    // Navigation properties
    public virtual Post? Post { get; set; }
    public virtual Tag? Tag { get; set; }
}
