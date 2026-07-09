using System.Text;
using DocumentFormat.OpenXml.Packaging;
using Portfolio.Application.AI.Models;
using Portfolio.Application.AI.Services;
using UglyToad.PdfPig;
using Microsoft.Extensions.Configuration;
namespace Portfolio.Infrastructure.AI;

public class JobDescriptionExtractionService(HttpClient httpClient, Microsoft.Extensions.Configuration.IConfiguration configuration) : IJobDescriptionExtractionService
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
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            return await httpClient.GetStringAsync(url, cts.Token);
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
        var maxFileSize = configuration.GetValue<long>("MAX_JOB_FIT_FILE_SIZE", 5 * 1024 * 1024);
        if (stream.Length > maxFileSize)
        {
            throw new ArgumentException($"PDF file size exceeds the maximum allowed limit of {maxFileSize / (1024 * 1024)}MB.");
        }
        
        var sb = new StringBuilder();
        try
        {
            using (var document = PdfDocument.Open(stream))
            {
                foreach (var page in document.GetPages())
                {
                    sb.AppendLine(page.Text);
                }
            }
        }
        catch (OutOfMemoryException ex)
        {
            throw new Exception("The PDF file is too complex and caused a memory error.", ex);
        }
        catch (StackOverflowException ex)
        {
            throw new Exception("The PDF file is too complex and caused a stack overflow.", ex);
        }
        catch (Exception ex)
        {
            throw new Exception($"Failed to parse PDF document. It may be malformed or corrupted: {ex.Message}", ex);
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
