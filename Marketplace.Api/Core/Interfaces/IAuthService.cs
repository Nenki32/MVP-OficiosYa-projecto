using Marketplace.Api.Delivery.DTOs.Auth;

namespace Marketplace.Api.Core.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterClienteAsync(RegisterClienteRequest request);
    Task<AuthResponse> RegisterProfesionalAsync(RegisterProfesionalRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task LogoutAsync(int userId);
}
