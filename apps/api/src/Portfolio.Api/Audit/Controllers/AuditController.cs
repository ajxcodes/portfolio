using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portfolio.Application.Audit.Repositories;
using Portfolio.Domain.Audit;

namespace Portfolio.Api.Audit.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize]
public class AuditController(IAuditRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AuditLog>>> GetLogsAsync([FromQuery] int limit = 50)
    {
        var logs = await repository.GetAuditLogsAsync(limit);
        return Ok(logs);
    }
}
