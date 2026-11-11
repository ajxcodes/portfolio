namespace Portfolio.Application.Content.Responses;

public record ProjectLinkResponse
{
    public required Guid Id { get; init; }
    public required string Type { get; init; }
    public required string Url { get; init; }
    public string? Label { get; init; }
    public int DisplayOrder { get; init; }
}
