using System;
using System.Collections.Generic;

namespace Portfolio.Domain.Resume;

public class SkillCategory
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string CategoryName { get; set; } = string.Empty;
    public string? IconName { get; set; }
    public int DisplayOrder { get; set; } = 0;

    // Navigation properties
    public virtual ICollection<Skill> Skills { get; set; } = new List<Skill>();
}
