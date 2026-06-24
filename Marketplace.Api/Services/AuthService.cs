using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Marketplace.Api.Data;
using Marketplace.Api.DTOs.Auth;
using Marketplace.Api.Models;

namespace Marketplace.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _db.Usuarios.AnyAsync(u => u.Email == request.Email))
            throw new InvalidOperationException("El email ya esta registrado.");

        var usuario = new Usuario
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Nombre = request.Nombre,
            Telefono = request.Telefono,
            Rol = request.Rol.ToLower(),
            NivelProfesional = request.Rol.ToLower() == "profesional" ? request.NivelProfesional?.ToLower() : null,
            Dni = request.Rol.ToLower() == "profesional" ? request.Dni : null,
            NumeroMatricula = request.Rol.ToLower() == "profesional" && request.NivelProfesional?.ToLower() == "premium"
                ? request.NumeroMatricula
                : null
        };

        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();

        return ToResponse(usuario, GenerateToken(usuario));
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email)
            ?? throw new UnauthorizedAccessException("Credenciales invalidas.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
            throw new UnauthorizedAccessException("Credenciales invalidas.");

        return ToResponse(usuario, GenerateToken(usuario));
    }

    public async Task<AuthResponse> GetCurrentUserAsync(int userId)
    {
        var usuario = await _db.Usuarios.FindAsync(userId)
            ?? throw new InvalidOperationException("Usuario no encontrado.");

        return ToResponse(usuario, GenerateToken(usuario));
    }

    private string GenerateToken(Usuario usuario)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Email, usuario.Email),
            new Claim(ClaimTypes.Role, usuario.Rol),
            new Claim("nivel_profesional", usuario.NivelProfesional ?? "")
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static AuthResponse ToResponse(Usuario u, string token) => new()
    {
        Id = u.Id,
        Email = u.Email,
        Nombre = u.Nombre,
        Rol = u.Rol,
        NivelProfesional = u.NivelProfesional,
        Token = token
    };
}
