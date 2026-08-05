using NetArchTest.Rules;
using Portfolio.Application.Extensions;

namespace Portfolio.Tests.Architecture;

public class ApplicationLayerTests
{
    [Fact]
    public void ApplicationLayer_ShouldNot_HaveDependencyOn_Infrastructure()
    {
        // Arrange
        var applicationAssembly = typeof(ServiceExtensions).Assembly;

        // Act
        var result = Types.InAssembly(applicationAssembly)
            .ShouldNot()
            .HaveDependencyOn("Portfolio.Infrastructure")
            .GetResult();

        // Assert
        Assert.True(result.IsSuccessful, "Application layer should not depend on Infrastructure layer.");
    }

    [Fact]
    public void ApplicationLayer_ShouldNot_HaveDependencyOn_QuestPDF()
    {
        // Arrange
        var applicationAssembly = typeof(ServiceExtensions).Assembly;

        // Act
        var result = Types.InAssembly(applicationAssembly)
            .ShouldNot()
            .HaveDependencyOn("QuestPDF")
            .GetResult();

        // Assert
        Assert.True(result.IsSuccessful, "Application layer should not depend on QuestPDF.");
    }
}
