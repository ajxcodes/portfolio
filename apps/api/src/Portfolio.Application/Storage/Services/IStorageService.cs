namespace Portfolio.Application.Storage.Services;

public interface IStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string? customKey = null);
    Task<string?> GetFileUrlIfExistsAsync(string key);
}
