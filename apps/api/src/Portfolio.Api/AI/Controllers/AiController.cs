using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Portfolio.Application.AI;
using Portfolio.Application.AI.Services;
using Portfolio.Application.Analytics.Services;
using Portfolio.Application.Resume.Services;
using Portfolio.Domain.Analytics;

namespace Portfolio.Api.AI.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController(
    IAiChatService chatService,
    IAiPromptService aiPromptService,
    IAnalyticsService analyticsService,
    IConfiguration configuration) : ControllerBase
{
    [HttpPost("chat")]
    [AllowAnonymous]
    [EnableRateLimiting("AiChatPolicy")]
    public async Task ChatAsync([FromBody] AiChatRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            Response.StatusCode = StatusCodes.Status400BadRequest;
            await Response.WriteAsync("Message is required.", cancellationToken);
            return;
        }

        var acceptHeader = Request.Headers.Accept.ToString();
        if (!string.IsNullOrEmpty(acceptHeader) && !acceptHeader.Contains("text/event-stream"))
        {
            Response.StatusCode = StatusCodes.Status406NotAcceptable;
            await Response.WriteAsync("Client must accept text/event-stream.", cancellationToken);
            return;
        }

        // Log the query
        var queryLog = new AiQueryLog
        {
            Id = Guid.CreateVersion7(),
            VisitorSessionId = request.VisitorSessionId,
            QueryText = request.Message,
            Provider = configuration["AI_PROVIDER"] ?? "Unknown",
            QueriedAt = DateTime.UtcNow
        };
        await analyticsService.LogAiQueryAsync(queryLog);

        // Fetch strict RAG system prompt from service
        var systemPrompt = await aiPromptService.BuildResumeSystemPromptAsync();

        Response.ContentType = "text/event-stream";
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");

        try
        {
            await foreach (var chunk in chatService.AskQuestionStreamAsync(systemPrompt, request.Message, cancellationToken))
            {
                // Format as SSE (Server-Sent Events) with JSON to cleanly escape newlines and quotes
                var payload = System.Text.Json.JsonSerializer.Serialize(new { text = chunk });
                await Response.WriteAsync($"data: {payload}\n\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
            // Client disconnected, perfectly normal
        }
        catch (Exception ex)
        {
            // Log it but do not crash the stream ungracefully
            await Response.WriteAsync($"event: error\ndata: {ex.Message}\n\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
        }
        finally
        {
            await Response.WriteAsync("event: done\ndata: [DONE]\n\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
        }
    }
}

public class AiChatRequest
{
    public string Message { get; set; } = string.Empty;
    public Guid? VisitorSessionId { get; set; }
}
