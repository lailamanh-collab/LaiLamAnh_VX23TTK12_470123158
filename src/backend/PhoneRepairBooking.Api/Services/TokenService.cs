using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using PhoneRepairBooking.Api.Domain;

namespace PhoneRepairBooking.Api.Services;

public class TokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public (string Token, DateTime ExpiresAt) CreateToken(ApplicationUser user, string role)
    {
        var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("Missing Jwt:Key.");
        var issuer = _configuration["Jwt:Issuer"] ?? "PhoneRepairBooking";
        var audience = _configuration["Jwt:Audience"] ?? "PhoneRepairBooking";
        var minutes = int.TryParse(_configuration["Jwt:ExpiresMinutes"], out var parsed) ? parsed : 120;
        var expiresAt = DateTime.UtcNow.AddMinutes(minutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, role)
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
