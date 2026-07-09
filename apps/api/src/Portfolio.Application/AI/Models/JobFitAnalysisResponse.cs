namespace Portfolio.Application.AI.Models;

public class JobFitAnalysisResponse
{
    public string Company { get; set; } = "Unknown Company";
    public string Role { get; set; } = "Unknown Role";
    public int MatchScore { get; set; }
    public List<string> GrowthOpportunities { get; set; } = new();
    public List<string> ActionChips { get; set; } = new();
}
