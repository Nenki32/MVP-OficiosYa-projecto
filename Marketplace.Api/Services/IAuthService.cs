using Marketplace.Api.DTOs.Auth;

namespace Marketplace.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterClienteAsync(RegisterClienteRequest request);
    Task<AuthResponse> RegisterProfesionalAsync(RegisterProfesionalRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> GetCurrentUserAsync(int userId);
    Task LogoutAsync(int userId);
}
