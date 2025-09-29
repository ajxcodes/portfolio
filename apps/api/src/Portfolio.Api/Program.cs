

using DotNetEnv;
using DotNetEnv.Configuration;
using Portfolio.Application.Extensions;
using Portfolio.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration.AddDotNetEnv(".env", LoadOptions.TraversePath()).Build();
builder.Services.AddControllers();
builder.Services
    .ConfigureApplication()
    .ConfigureInfrastructure(configuration)
    .AddEndpointsApiExplorer()
    .AddSwaggerGen();

var app = builder.Build();

    app.UseSwagger()
        .UseSwaggerUI()
        .UseHttpsRedirection();
    
    app.MapControllers();
    
    app.Run();