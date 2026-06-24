using System.Security.Claims;

namespace Marketplace.Api.Core.Interfaces;

public interface IJwtService
{
    string GenerateToken(IEnumerable<Claim> claims);
}
