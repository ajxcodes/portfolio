namespace Portfolio.Application.AI.Models;

public class JobFitUploadRequest
{
    public string? RawText { get; set; }
    public string? Url { get; set; }
    public Stream? FileStream { get; set; }
    public string? FileName { get; set; }
}
