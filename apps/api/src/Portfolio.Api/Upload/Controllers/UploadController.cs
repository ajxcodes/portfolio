using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portfolio.Application.Storage.Services;

namespace Portfolio.Api.Upload.Controllers;

[ApiController]
[Route("api/admin/upload")]
[Authorize]
public class UploadController(IStorageService storageService, IConfiguration configuration) : ControllerBase
{
    private static readonly string[] AllowedImageMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    private static readonly string[] AllowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    
    private static readonly string[] AllowedVideoMimeTypes = ["video/mp4", "video/webm", "video/quicktime"];
    private static readonly string[] AllowedVideoExtensions = [".mp4", ".webm", ".mov"];
    
    [HttpPost]
    [DisableRequestSizeLimit]
    [RequestFormLimits(ValueLengthLimit = int.MaxValue, MultipartBodyLengthLimit = int.MaxValue)]
    public async Task<IActionResult> UploadAsync(IFormFile file)
    {
        var maxFileSizeBytes = configuration.GetValue<long>("Upload:MaxFileSizeBytes", 50 * 1024 * 1024);

        if (file == null || file.Length == 0)
        {
            return BadRequest("No file was uploaded");
        }

        if (file.Length > maxFileSizeBytes)
        {
            return BadRequest($"File size exceeds the {maxFileSizeBytes / (1024 * 1024)}MB limit");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var contentType = file.ContentType.ToLowerInvariant();

        var isImage = AllowedImageExtensions.Contains(extension) && AllowedImageMimeTypes.Contains(contentType);
        var isVideo = AllowedVideoExtensions.Contains(extension) && AllowedVideoMimeTypes.Contains(contentType);

        if (!isImage && !isVideo)
        {
            return BadRequest("Invalid media format. Allowed formats: JPEG, PNG, WEBP, GIF, MP4, WEBM, MOV");
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
