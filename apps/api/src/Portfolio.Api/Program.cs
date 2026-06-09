

using DotNetEnv;
using DotNetEnv.Configuration;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Portfolio.Api.Authentication;
using System.Security.Claims;
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

var bypassAuth = builder.Environment.IsDevelopment() || 
                 string.Equals(Environment.GetEnvironmentVariable("LOCAL_DEV_BYPASS_AUTH"), "true", StringComparison.OrdinalIgnoreCase);

if (bypassAuth)
{
    builder.Services.AddAuthentication("MockScheme")
        .AddScheme<AuthenticationSchemeOptions, MockAuthHandler>("MockScheme", null);
}
else
{
    var supabaseUrl = builder.Configuration["SUPABASE_URL"] ?? throw new ArgumentException("SUPABASE_URL is missing");
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = $"{supabaseUrl}/auth/v1";
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = $"{supabaseUrl}/auth/v1",
                ValidateAudience = true,
                ValidAudience = "authenticated",
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ClockSkew = TimeSpan.Zero
            };
        });
}

builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .RequireAssertion(context =>
        {
            if (bypassAuth) return true;
            
            var adminEmail = Environment.GetEnvironmentVariable("ADMIN_EMAIL");
            if (string.IsNullOrEmpty(adminEmail)) return false;
            
            var emailClaim = context.User.FindFirst("email")?.Value ?? context.User.FindFirst(ClaimTypes.Email)?.Value;
            return string.Equals(emailClaim, adminEmail, StringComparison.OrdinalIgnoreCase);
        })
        .Build();
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddControllers();
const string myAllowSpecificOrigins = "_myAllowSpecificOrigins";
builder.Services
    .ConfigureApplication()
    .ConfigureInfrastructure(builder.Configuration)
    .AddEndpointsApiExplorer()
    .AddSwaggerGen().AddCors(options =>
    {
        options.AddPolicy(name: myAllowSpecificOrigins,
            policy =>
            {
                // Allow your Next.js app's origin
                policy.AllowAnyOrigin()
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
    });

var app = builder.Build();

app.UseSwagger()
    .UseSwaggerUI()
    .UseHttpsRedirection()
    .UseCors(myAllowSpecificOrigins);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
await app.Services.RunMigrations();
app.Run();

public partial class Program { }