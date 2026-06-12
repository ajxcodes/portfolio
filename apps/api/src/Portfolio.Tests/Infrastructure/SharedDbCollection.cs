using Xunit;

namespace Portfolio.Tests.Infrastructure;

[CollectionDefinition("SharedDbCollection")]
public class SharedDbCollection : ICollectionFixture<DbTestFixture>
{
    // This class has no code, and is never created. Its purpose is simply
    // to be the place to apply [CollectionDefinition] and all the
    // ICollectionFixture<> interfaces.
}
