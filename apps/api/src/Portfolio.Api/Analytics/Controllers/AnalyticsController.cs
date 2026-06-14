using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portfolio.Application.Analytics.Services;
using Portfolio.Domain.Analytics;

namespace Portfolio.Api.Analytics.Controllers;

[ApiController]
[Route("api/analytics")]
public class AnalyticsController(IAnalyticsService service) : ControllerBase
{
    [HttpPost("views")]
    [AllowAnonymous]
    public async Task<IActionResult> LogPageViewAsync([FromBody] PageViewRequest request)
    {
        var ipAddress = GetClientIpAddress();
        var userAgent = request.UserAgent ?? Request.Headers.UserAgent.ToString();

        var trackingId = GetTrackingId(ipAddress, userAgent);
        var session = await service.GetOrCreateVisitorSessionAsync(trackingId);

        var log = new PageViewLog
        {
            Id = Guid.CreateVersion7(),
            VisitorSessionId = session.Id,
            ReferrerSource = request.ReferrerSource ?? "Direct",
            ViewedAt = DateTime.UtcNow,
            Country = request.Country,
            City = request.City
        };

        await service.LogPageViewAsync(log);
        return Ok(new { Success = true, VisitorSessionId = session.Id });
    }

    [HttpPost("clicks")]
    [AllowAnonymous]
    public async Task<IActionResult> LogLinkClickAsync([FromBody] LinkClickRequest request)
    {
        if (request.LinkId == Guid.Empty)
        {
            return BadRequest("LinkId is required");
        }

        var ipAddress = GetClientIpAddress();
        var userAgent = request.UserAgent ?? Request.Headers.UserAgent.ToString();

        var trackingId = GetTrackingId(ipAddress, userAgent);
        var session = await service.GetOrCreateVisitorSessionAsync(trackingId);

        var log = new LinkClickLog
        {
            Id = Guid.CreateVersion7(),
            VisitorSessionId = session.Id,
            LinkId = request.LinkId,
            ClickedAt = DateTime.UtcNow,
            ReferrerSource = request.ReferrerSource,
            Country = request.Country,
            City = request.City
        };

        await service.LogLinkClickAsync(log);
        return Ok(new { Success = true, VisitorSessionId = session.Id });
    }

    [HttpGet("summary")]
    [Authorize]
    public async Task<ActionResult<AnalyticsSummaryDto>> GetSummaryAsync([FromQuery] int limit = 20)
    {
        var summaryDto = await service.GetSummaryAsync(limit);
        return Ok(summaryDto);
    }

    private string? GetClientIpAddress()
    {
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
        {
            var ip = forwardedFor.FirstOrDefault()?.Split(',').FirstOrDefault()?.Trim();
            if (!string.IsNullOrEmpty(ip)) return ip;
        }

        if (Request.Headers.TryGetValue("X-Real-IP", out var realIp))
        {
            var ip = realIp.FirstOrDefault()?.Trim();
            if (!string.IsNullOrEmpty(ip)) return ip;
        }

        return HttpContext.Connection.RemoteIpAddress?.ToString();
    }

    private static string GetTrackingId(string? ipAddress, string? userAgent)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var inputBytes = System.Text.Encoding.UTF8.GetBytes($"{ipAddress}_{userAgent}");
        var hashBytes = sha256.ComputeHash(inputBytes);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }
}

public class PageViewRequest
{
    public string? ReferrerSource { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public string? UserAgent { get; set; }
}

public class LinkClickRequest
{
    public Guid LinkId { get; set; }
    public string? ReferrerSource { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public string? UserAgent { get; set; }
}
