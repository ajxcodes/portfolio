using System.Reflection;
using Microsoft.EntityFrameworkCore;

namespace Portfolio.Infrastructure.Database.Contexts;

public class PortfolioDbContext(DbContextOptions options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}