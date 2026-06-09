using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Portfolio.Infrastructure.Database.Converters;

public class AesEncryptionConverter : ValueConverter<string, string>
{
    private static readonly string EncryptionKey = Environment.GetEnvironmentVariable("ENCRYPTION_KEY") ?? throw new InvalidOperationException("ENCRYPTION_KEY environment variable is not set.");

    public AesEncryptionConverter() : base(
        v => Encrypt(v),
        v => Decrypt(v))
    {
    }

    private static string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText)) return plainText;

        byte[] keyBytes = GetKeyBytes(EncryptionKey);
        using var aes = Aes.Create();
        aes.Key = keyBytes;
        aes.GenerateIV();
        byte[] iv = aes.IV;

        using var encryptor = aes.CreateEncryptor(aes.Key, iv);
        using var ms = new MemoryStream();
        ms.Write(iv, 0, iv.Length);

        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        using (var sw = new StreamWriter(cs))
        {
            sw.Write(plainText);
        }

        return Convert.ToBase64String(ms.ToArray());
    }

    private static string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText)) return cipherText;

        byte[] fullCipher = Convert.FromBase64String(cipherText);
        byte[] keyBytes = GetKeyBytes(EncryptionKey);

        using var aes = Aes.Create();
        aes.Key = keyBytes;

        byte[] iv = new byte[aes.BlockSize / 8];
        byte[] cipher = new byte[fullCipher.Length - iv.Length];

        Array.Copy(fullCipher, 0, iv, 0, iv.Length);
        Array.Copy(fullCipher, iv.Length, cipher, 0, cipher.Length);

        aes.IV = iv;

        using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream(cipher);
        using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
        using var sr = new StreamReader(cs);

        return sr.ReadToEnd();
    }

    private static byte[] GetKeyBytes(string key)
    {
        var actualBytes = Encoding.UTF8.GetBytes(key);
        if (actualBytes.Length != 32)
        {
            throw new InvalidOperationException($"ENCRYPTION_KEY must be exactly 32 bytes (256 bits) long. Current length is {actualBytes.Length} bytes.");
        }
        return actualBytes;
    }
}
