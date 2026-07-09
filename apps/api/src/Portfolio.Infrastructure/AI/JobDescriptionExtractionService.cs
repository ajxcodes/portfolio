using System.Text;
using DocumentFormat.OpenXml.Packaging;
using Portfolio.Application.AI.Models;
using Portfolio.Application.AI.Services;
using UglyToad.PdfPig;

namespace Portfolio.Infrastructure.AI;

public class JobDescriptionExtractionService(HttpClient httpClient) : IJobDescriptionExtractionService
{
    public async Task<string> ExtractJobDescriptionAsync(JobFitUploadRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.RawText))
        {
            return request.RawText;
        }

        if (!string.IsNullOrWhiteSpace(request.Url))
        {
            return await ExtractFromUrlAsync(request.Url);
        }

        if (request.FileStream != null && !string.IsNullOrWhiteSpace(request.FileName))
        {
            return await ExtractFromFileAsync(request.FileStream, request.FileName);
        }

        throw new ArgumentException("No valid job description source provided.");
    }

    private async Task<string> ExtractFromUrlAsync(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || 
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new ArgumentException("Invalid URL provided. Only HTTP and HTTPS schemes are allowed.");
        }

#if !DEBUG
        if (uri.IsLoopback || 
            uri.HostNameType == UriHostNameType.IPv4 && (
                uri.Host.StartsWith("127.") || 
                uri.Host.StartsWith("10.") || 
                uri.Host.StartsWith("192.168.") || 
                uri.Host.StartsWith("172.")
            ) || 
            uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("URL must not point to a local or private network.");
        }
#endif

        try
        {
            return await httpClient.GetStringAsync(url);
        }
        catch (Exception ex)
        {
            throw new Exception($"Failed to extract text from URL: {ex.Message}");
        }
    }

    private async Task<string> ExtractFromFileAsync(Stream fileStream, string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        if (extension == ".pdf")
        {
            return ExtractFromPdf(fileStream);
        }
        
        if (extension == ".docx")
        {
            return ExtractFromDocx(fileStream);
        }

        if (extension == ".txt")
        {
            using var reader = new StreamReader(fileStream);
            return await reader.ReadToEndAsync();
        }

        throw new NotSupportedException($"File format {extension} is not supported for extraction.");
    }

    private string ExtractFromPdf(Stream stream)
    {
        var sb = new StringBuilder();
        using (var document = PdfDocument.Open(stream))
        {
            foreach (var page in document.GetPages())
            {
                sb.AppendLine(page.Text);
            }
        }
        return sb.ToString();
    }

    private string ExtractFromDocx(Stream stream)
    {
        using var wordDocument = WordprocessingDocument.Open(stream, false);
        var body = wordDocument.MainDocumentPart?.Document.Body;
        return body?.InnerText ?? string.Empty;
    }
}
