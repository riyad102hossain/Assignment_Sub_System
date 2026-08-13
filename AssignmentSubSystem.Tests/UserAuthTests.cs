using Xunit;

namespace AssignmentSubSystem.Tests;

public class UserAuthTests
{
    [Fact]
    public void HashingPassword_ProducesNonNullHash()
    {
        var password = "Test@123";
        var hash = BCrypt.Net.BCrypt.HashPassword(password);

        Assert.False(string.IsNullOrWhiteSpace(hash));
    }

    [Fact]
    public void Verify_CorrectPassword_ReturnsTrue()
    {
        var password = "SecretPass!";
        var hash = BCrypt.Net.BCrypt.HashPassword(password);

        Assert.True(BCrypt.Net.BCrypt.Verify(password, hash));
    }

    [Fact]
    public void Verify_IncorrectPassword_ReturnsFalse()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("RightPassword");

        Assert.False(BCrypt.Net.BCrypt.Verify("WrongPassword", hash));
    }
}
