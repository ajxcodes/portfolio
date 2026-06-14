using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Portfolio.Application.AI;

namespace Portfolio.Infrastructure.AI;

public class GeminiChatService : IAiChatService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GeminiChatService> _logger;
    private readonly string _apiKey;
    private readonly string _model;
    private readonly double _temperature;

    public GeminiChatService(HttpClient httpClient, IConfiguration configuration, ILogger<GeminiChatService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        
        _apiKey = configuration["GEMINI_API_KEY"] ?? string.Empty;
        _model = configuration["GEMINI_MODEL"] ?? "gemini-1.5-flash";
        
        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("GEMINI_API_KEY is not configured! GeminiChatService will fail if invoked.");
        }

        if (!double.TryParse(configuration["AI_TEMPERATURE"], out _temperature))
        {
            _temperature = 0.1;
        }
    }

    public async IAsyncEnumerable<string> AskQuestionStreamAsync(
        string systemPrompt, 
        string userMessage, 
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            throw new InvalidOperationException("GEMINI_API_KEY is not configured in the environment variables.");
        }

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:streamGenerateContent?key={_apiKey}";

        var requestBody = new
        {
            system_instruction = new
            {
                parts = new[] { new { text = systemPrompt } }
            },
            contents = new[]
            {
                new { role = "user", parts = new[] { new { text = userMessage } } }
            },
            generationConfig = new
            {
                temperature = _temperature
            }
        };

        var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = jsonContent
        };

        HttpResponseMessage? response = null;
        bool success = false;
        try
        {
            // Use HttpCompletionOption.ResponseHeadersRead to stream the response
            response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            response.EnsureSuccessStatusCode();
            success = true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to Google Gemini API.");
        }

        if (!success || response == null)
        {
            yield return "I'm sorry, my neural link to the Google Gemini servers is currently offline. Please try again later.";
            yield break;
        }

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var reader = new StreamReader(stream);
        
        // Gemini stream returns an array of JSON objects via Server-Sent Events (but technically it's a JSON array format chunked)
        // Wait, Gemini Developer API streamGenerateContent returns JSON chunks that look like:
        // [
        //   { "candidates": [ ... ] },
        //   { "candidates": [ ... ] }
        // ]
        // but sent chunk by chunk over the HTTP response stream.

        // We can just read the stream chunk by chunk and do some naive parsing to find the text parts.
        // A more robust approach parses the JSON properly, but since chunks might be partial strings, we buffer them.
        
        var buffer = new StringBuilder();
        
        string? line;
        while ((line = await reader.ReadLineAsync(cancellationToken)) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;
            
            buffer.AppendLine(line);
            var bufferStr = buffer.ToString();
            
            // Try to extract the "text": "..." part
            // It's safer to attempt to parse valid JSON objects if the buffer contains balanced braces.
            // For simplicity and speed in this naive implementation, we'll look for the text field in the raw string.
            // In a production app, we should use System.Text.Json.Utf8JsonReader.
            
            // For now, let's implement a clean JSON parsing of the chunks.
            // Gemini stream output usually separates chunks with commas, inside a global array.
            
            // Let's just grab the text values robustly
            // This is a naive regex-like search that's very fast, but for production we should parse the JSON token.
            string? extractedText = null;
            try
            {
                if (bufferStr.Trim().StartsWith("{") && bufferStr.Trim().EndsWith("}") || 
                    bufferStr.Trim().StartsWith("{") && bufferStr.Trim().EndsWith("},"))
                {
                    var cleanJson = bufferStr.Trim();
                    if (cleanJson.EndsWith(",")) cleanJson = cleanJson[..^1]; // remove trailing comma
                    
                    using var doc = JsonDocument.Parse(cleanJson);
                    if (doc.RootElement.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
                    {
                        var firstCandidate = candidates[0];
                        if (firstCandidate.TryGetProperty("content", out var content) &&
                            content.TryGetProperty("parts", out var parts) && parts.GetArrayLength() > 0)
                        {
                            var textPart = parts[0];
                            if (textPart.TryGetProperty("text", out var textToken))
                            {
                                extractedText = textToken.GetString();
                            }
                        }
                    }
                    
                    // Reset buffer after successful parse
                    buffer.Clear();
                }
            }
            catch (JsonException)
            {
                // Incomplete JSON chunk, keep buffering
            }

            if (!string.IsNullOrEmpty(extractedText))
            {
                yield return extractedText;
            }
        }
    }
}
