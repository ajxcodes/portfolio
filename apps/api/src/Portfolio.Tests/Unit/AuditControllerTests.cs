using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using Portfolio.Api.Audit.Controllers;
using Portfolio.Application.Audit.Repositories;
using Portfolio.Domain.Audit;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit;

public class AuditControllerTests
{
    private readonly IAuditRepository _repositoryMock = Substitute.For<IAuditRepository>();
    private readonly AuditController _controller;

    public AuditControllerTests()
    {
        _controller = new AuditController(_repositoryMock);
    }

    [Fact]
    public async Task GetLogsAsync_ReturnsOk_WithLogs()
    {
        var logs = new List<AuditLog> { new() { Id = Guid.NewGuid(), Action = "Test" } };
        _repositoryMock.GetAuditLogsAsync(10).Returns(logs);

        var result = await _controller.GetLogsAsync(10);

        var okResult = result.Result.ShouldBeOfType<OkObjectResult>();
        okResult.Value.ShouldBe(logs);
    }
}
