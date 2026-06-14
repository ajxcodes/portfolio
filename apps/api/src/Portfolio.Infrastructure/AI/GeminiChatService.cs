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

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:streamGenerateContent?key={_apiKey}&alt=sse";

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
        
        string? line;
        while ((line = await reader.ReadLineAsync(cancellationToken)) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;
            if (!line.StartsWith("data: ")) continue;
            
            var json = line.Substring("data: ".Length).Trim();
            if (json == "[DONE]") break;
            
            string? extractedText = null;
            try
            {
                using var doc = JsonDocument.Parse(json);
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
            }
            catch (JsonException)
            {
                // Incomplete or malformed JSON chunk, ignore
            }

            if (!string.IsNullOrEmpty(extractedText))
            {
                yield return extractedText;
            }
        }
    }
}
