using Marketplace.Api.DTOs.Auth;

namespace Marketplace.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> GetCurrentUserAsync(int userId);
}
