using System;
using Portfolio.Infrastructure.Database.Converters;
using Shouldly;
using Xunit;

namespace Portfolio.Tests.Unit.Infrastructure.Database.Converters;

public class AesEncryptionConverterTests
{
    public AesEncryptionConverterTests()
    {
        // Ensure the environment variable is set for tests
        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ENCRYPTION_KEY")))
        {
            Environment.SetEnvironmentVariable("ENCRYPTION_KEY", "12345678901234567890123456789012");
        }
    }

    [Fact]
    public void Convert_WithValidString_EncryptsAndDecryptsSuccessfully()
    {
        // Arrange
        var converter = new AesEncryptionConverter();
        var convertToProvider = converter.ConvertToProviderExpression.Compile();
        var convertFromProvider = converter.ConvertFromProviderExpression.Compile();
        
        var originalText = "SuperSecretPassword123!";

        // Act
        var encryptedText = convertToProvider(originalText);
        var decryptedText = convertFromProvider(encryptedText);

        // Assert
        encryptedText.ShouldNotBe(originalText);
        encryptedText.ShouldNotBeNullOrEmpty();
        decryptedText.ShouldBe(originalText);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Convert_WithNullOrEmptyString_ReturnsSameValue(string? input)
    {
        // Arrange
        var converter = new AesEncryptionConverter();
        var convertToProvider = converter.ConvertToProviderExpression.Compile();
        var convertFromProvider = converter.ConvertFromProviderExpression.Compile();

        // Act
        var encryptedText = convertToProvider(input);
        var decryptedText = convertFromProvider(input);

        // Assert
        encryptedText.ShouldBe(input);
        decryptedText.ShouldBe(input);
    }
}
