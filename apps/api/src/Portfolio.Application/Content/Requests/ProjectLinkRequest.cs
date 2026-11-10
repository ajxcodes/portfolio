namespace Portfolio.Application.Content.Requests;

public class ProjectLinkRequest
{
    public required string Type { get; set; }
    public required string Url { get; set; }
    public string? Label { get; set; }
}
