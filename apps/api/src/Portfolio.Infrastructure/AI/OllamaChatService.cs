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
using Portfolio.Application.AI;

namespace Portfolio.Infrastructure.AI;

public class OllamaChatService : IAiChatService
{
    private readonly HttpClient _httpClient;
    private readonly string _endpoint;
    private readonly string _model;
    private readonly double _temperature;

    public OllamaChatService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _endpoint = configuration["OLLAMA_ENDPOINT"] ?? "http://localhost:11434";
        // User specifically wants Gemma4 E2B, in Ollama this is typically aliased or referred to as a specific tag.
        // We will default to a placeholder tag but allow env var override.
        _model = configuration["OLLAMA_MODEL"] ?? "gemma2:2b"; 
        
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
        var requestUri = $"{_endpoint.TrimEnd('/')}/api/chat";

        var payload = new
        {
            model = _model,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            },
            stream = true,
            options = new
            {
                temperature = _temperature
            }
        };

        var jsonPayload = JsonSerializer.Serialize(payload);
        using var request = new HttpRequestMessage(HttpMethod.Post, requestUri)
        {
            Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json")
        };

        using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var reader = new StreamReader(stream);

        string? line;
        while ((line = await reader.ReadLineAsync(cancellationToken)) != null)
        {
            if (cancellationToken.IsCancellationRequested) break;
            
            if (string.IsNullOrWhiteSpace(line)) continue;

            using var document = JsonDocument.Parse(line);
            var root = document.RootElement;

            if (root.TryGetProperty("message", out var messageElement) && 
                messageElement.TryGetProperty("content", out var contentElement))
            {
                var content = contentElement.GetString();
                if (!string.IsNullOrEmpty(content))
                {
                    yield return content;
                }
            }

            if (root.TryGetProperty("done", out var doneElement) && doneElement.GetBoolean())
            {
                break;
            }
        }
    }
}
