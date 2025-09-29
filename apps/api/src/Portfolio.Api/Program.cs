

using DotNetEnv;
using DotNetEnv.Configuration;
using Portfolio.Application.Extensions;
using Portfolio.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
// For local development, load the .env file to simulate the container environment.
// In Docker, these variables will be provided by the 'env_file' in docker-compose.yml.
if (builder.Environment.IsDevelopment())
{
    // Using DotNetEnv.Configuration to integrate with IConfiguration
    builder.Configuration.AddDotNetEnv(".env", LoadOptions.TraversePath());
}

builder.Configuration.AddEnvironmentVariables();
builder.Services.AddControllers();
builder.Services
    .ConfigureApplication()
    .ConfigureInfrastructure(builder.Configuration)
    .AddEndpointsApiExplorer()
    .AddSwaggerGen();

var app = builder.Build();

    app.UseSwagger()
        .UseSwaggerUI()
        .UseHttpsRedirection();
    
    app.MapControllers();
    
    app.Run();