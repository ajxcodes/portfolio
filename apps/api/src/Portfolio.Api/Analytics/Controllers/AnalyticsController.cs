using System;
using System.Collections.Generic;
using System.Threading.Tasks;
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
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = request.UserAgent ?? Request.Headers.UserAgent.ToString();

        var log = new PageViewLog
        {
            Id = Guid.CreateVersion7(),
            ReferrerSource = request.ReferrerSource ?? "Direct",
            ViewedAt = DateTime.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Country = request.Country,
            City = request.City
        };

        await service.LogPageViewAsync(log);
        return Ok(new { Success = true });
    }

    [HttpPost("clicks")]
    [AllowAnonymous]
    public async Task<IActionResult> LogLinkClickAsync([FromBody] LinkClickRequest request)
    {
        if (request.LinkId == Guid.Empty)
        {
            return BadRequest("LinkId is required");
        }

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = request.UserAgent ?? Request.Headers.UserAgent.ToString();

        var log = new LinkClickLog
        {
            Id = Guid.CreateVersion7(),
            LinkId = request.LinkId,
            ClickedAt = DateTime.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            ReferrerSource = request.ReferrerSource,
            Country = request.Country,
            City = request.City
        };

        await service.LogLinkClickAsync(log);
        return Ok(new { Success = true });
    }

    [HttpGet("summary")]
    [Authorize]
    public async Task<ActionResult<AnalyticsSummaryDto>> GetSummaryAsync([FromQuery] int limit = 20)
    {
        var summaryDto = await service.GetSummaryAsync(limit);
        return Ok(summaryDto);
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
