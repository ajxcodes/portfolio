using System;

namespace Portfolio.Domain.Analytics;

public class AiQueryLog
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    
    public Guid? VisitorSessionId { get; set; }
    
    /// <summary>
    /// The user's query sent to the AI.
    /// </summary>
    public string QueryText { get; set; } = string.Empty;
    
    /// <summary>
    /// The AI provider used (e.g. "Ollama", "Gemini").
    /// </summary>
    public string Provider { get; set; } = string.Empty;

    public DateTime QueriedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public virtual VisitorSession? VisitorSession { get; set; }
}
