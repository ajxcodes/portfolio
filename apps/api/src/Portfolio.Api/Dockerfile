# Stage 1: Build the application
# Using a specific version is better than :9.0 for reproducibility
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files and restore dependencies first to leverage Docker layer caching
# Source paths are relative to the build context (likely the repository root)
# Destination paths are relative to WORKDIR /src
COPY src/Portfolio.Api/*.csproj Portfolio.Api/
# You might need a .sln file copy here too if you have one
# COPY Portfolio.sln .
RUN dotnet restore Portfolio.Api/Portfolio.Api.csproj

# Copy the rest of the source code
# Source path is relative to the build context (likely the repository root)
# Destination path is relative to WORKDIR /src
COPY src/. .

# Publish the application, creating a release-ready output
# No need for a separate build step, publish does it all
RUN dotnet publish Portfolio.Api/Portfolio.Api.csproj -c Release -o /app/publish --no-restore

# Stage 2: Create the final, lean runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# 💡 NEW SECTION TO FIX PERMISSIONS
# Temporarily switch to root to create the directory and set ownership
USER root
# Ensure the directory exists and is owned by the 'app' user
RUN mkdir -p /home/app/.aspnet/https/ && chown -R app:app /home/app/.aspnet

# Switch to the non-root 'app' user for security
USER app

EXPOSE 443
# This is the command that will run the application
ENTRYPOINT ["dotnet", "Portfolio.Api.dll"]