using System.Security.Claims;
using Marketplace.Api.Core.Interfaces;
using Marketplace.Api.Core.Models;
using Marketplace.Api.Delivery.DTOs.Auth;

namespace Marketplace.Api.Core.UseCases;

public class AuthUseCase : IAuthService
{
    private readonly IUsuarioRepository _usuarioRepo;
    private readonly IJwtService _jwt;
    private readonly IPasswordHasher _passwordHasher;

    public AuthUseCase(IUsuarioRepository usuarioRepo, IJwtService jwt, IPasswordHasher passwordHasher)
    {
        _usuarioRepo = usuarioRepo;
        _jwt = jwt;
        _passwordHasher = passwordHasher;
    }

    public async Task<AuthResponse> RegisterClienteAsync(RegisterClienteRequest request)
    {
        if (await _usuarioRepo.ExistsByEmailAsync(request.Email))
            throw new InvalidOperationException("El email ya esta registrado.");

        var usuario = new Usuario
        {
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Nombre = request.Nombre,
            Telefono = request.Telefono,
            Rol = "cliente",
            Dni = request.Dni,
        };

        await _usuarioRepo.AddAsync(usuario);

        return ToAuthResponse(usuario, null);
    }

    public async Task<AuthResponse> RegisterProfesionalAsync(RegisterProfesionalRequest request)
    {
        if (await _usuarioRepo.ExistsByEmailAsync(request.Email))
            throw new InvalidOperationException("El email ya esta registrado.");

        var nivel = request.NivelProfesional?.ToLower() == "premium" ? "premium" : "standard";

        var usuario = new Usuario
        {
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Nombre = request.Nombre,
            Telefono = request.Telefono,
            Rol = "profesional",
            NivelProfesional = nivel,
            Dni = request.Dni,
            NumeroMatricula = nivel == "premium" ? request.NumeroMatricula : null,
        };

        await _usuarioRepo.AddAsync(usuario);

        return ToAuthResponse(usuario, null);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var usuario = await _usuarioRepo.GetByEmailAsync(request.Email)
            ?? throw new UnauthorizedAccessException("Credenciales invalidas.");

        if (!_passwordHasher.Verify(request.Password, usuario.PasswordHash))
            throw new UnauthorizedAccessException("Credenciales invalidas.");

        usuario.Estado = (int)EstadoUsuario.Activo;
        usuario.ActualizadoEn = DateTime.UtcNow;
        await _usuarioRepo.UpdateAsync(usuario);

        var token = usuario.Rol == "admin" ? _jwt.GenerateToken(BuildClaims(usuario)) : null;
        return ToAuthResponse(usuario, token);
    }

    public async Task LogoutAsync(int userId)
    {
        var usuario = await _usuarioRepo.GetByIdAsync(userId);
        if (usuario != null)
        {
            usuario.Estado = (int)EstadoUsuario.NoActivo;
            usuario.ActualizadoEn = DateTime.UtcNow;
            await _usuarioRepo.UpdateAsync(usuario);
        }
    }

    private static List<Claim> BuildClaims(Usuario usuario) =>
    [
        new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
        new Claim(ClaimTypes.Email, usuario.Email),
        new Claim(ClaimTypes.Role, usuario.Rol),
        new Claim("estado", usuario.Estado.ToString())
    ];

    private static AuthResponse ToAuthResponse(Usuario u, string? token) => new()
    {
        Id = u.Id,
        Email = u.Email,
        Nombre = u.Nombre,
        Rol = u.Rol,
        NivelProfesional = u.NivelProfesional,
        Estado = u.Estado,
        Token = token
    };
}
