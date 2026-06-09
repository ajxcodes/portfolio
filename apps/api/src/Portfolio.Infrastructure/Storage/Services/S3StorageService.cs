using Amazon.S3;
using Amazon.S3.Model;
using Portfolio.Application.Storage.Services;

namespace Portfolio.Infrastructure.Storage.Services;

public class S3StorageService : IStorageService
{
    private readonly string _bucketName;
    private readonly string _endpoint;
    private readonly AmazonS3Client _s3Client;

    public S3StorageService()
    {
        _endpoint = Environment.GetEnvironmentVariable("S3_ENDPOINT") ?? "http://localhost:9000";
        var accessKey = Environment.GetEnvironmentVariable("S3_ACCESS_KEY") ?? "minioadmin";
        var secretKey = Environment.GetEnvironmentVariable("S3_SECRET_KEY") ?? "minioadminpassword";
        _bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME") ?? "portfolio-media";

        var config = new AmazonS3Config
        {
            ServiceURL = _endpoint,
            ForcePathStyle = true
        };

        _s3Client = new AmazonS3Client(accessKey, secretKey, config);
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string? customKey = null)
    {
        try
        {
            var bucketExists = await Amazon.S3.Util.AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, _bucketName);
            if (!bucketExists)
            {
                await _s3Client.PutBucketAsync(new PutBucketRequest { BucketName = _bucketName });

                var publicReadPolicy = @"{
                    ""Version"": ""2012-10-17"",
                    ""Statement"": [
                        {
                            ""Sid"": ""PublicRead"",
                            ""Effect"": ""Allow"",
                            ""Principal"": ""*"",
                            ""Action"": [""s3:GetObject""],
                            ""Resource"": [""arn:aws:s3:::" + _bucketName + @"/*""]
                        }
                    ]
                }";
                await _s3Client.PutBucketPolicyAsync(new PutBucketPolicyRequest
                {
                    BucketName = _bucketName,
                    Policy = publicReadPolicy
                });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error checking or creating S3 bucket: {ex.Message}");
        }

        var fileExtension = Path.GetExtension(fileName);
        var objectKey = customKey ?? $"{Guid.NewGuid()}{fileExtension}";

        var request = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = objectKey,
            InputStream = fileStream,
            ContentType = contentType
        };

        await _s3Client.PutObjectAsync(request);

        var publicUrlBase = Environment.GetEnvironmentVariable("S3_PUBLIC_URL");
        if (string.IsNullOrEmpty(publicUrlBase))
        {
            var displayEndpoint = _endpoint.TrimEnd('/');
            if (displayEndpoint.Contains("minio:"))
            {
                displayEndpoint = displayEndpoint.Replace("minio:", "localhost:");
            }
            return $"{displayEndpoint}/{_bucketName}/{objectKey}";
        }

        return $"{publicUrlBase.TrimEnd('/')}/{objectKey}";
    }

    public async Task<string?> GetFileUrlIfExistsAsync(string key)
    {
        try
        {
            await _s3Client.GetObjectMetadataAsync(_bucketName, key);

            var publicUrlBase = Environment.GetEnvironmentVariable("S3_PUBLIC_URL");
            if (string.IsNullOrEmpty(publicUrlBase))
            {
                var displayEndpoint = _endpoint.TrimEnd('/');
                if (displayEndpoint.Contains("minio:"))
                {
                    displayEndpoint = displayEndpoint.Replace("minio:", "localhost:");
                }
                return $"{displayEndpoint}/{_bucketName}/{key}";
            }

            return $"{publicUrlBase.TrimEnd('/')}/{key}";
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error checking if S3 file exists: {ex.Message}");
            return null;
        }
    }
}
