using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portfolio.Application.Storage.Services;

namespace Portfolio.Api.Upload.Controllers;

[ApiController]
[Route("api/admin/upload")]
[Authorize]
public class UploadController(IStorageService storageService) : ControllerBase
{
    private static readonly string[] AllowedImageMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    private static readonly string[] AllowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    [HttpPost]
    public async Task<IActionResult> UploadAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file was uploaded");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            return BadRequest("File size exceeds the 5MB limit");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedImageExtensions.Contains(extension) || !AllowedImageMimeTypes.Contains(file.ContentType.ToLowerInvariant()))
        {
            return BadRequest("Invalid image format. Allowed formats: JPEG, PNG, WEBP, GIF");
        }

        try
        {
            using var stream = file.OpenReadStream();
            var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
            var publicUrl = await storageService.UploadFileAsync(stream, uniqueFileName, file.ContentType);
            return Ok(new { Url = publicUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error uploading file: {ex.Message}");
        }
    }
}
