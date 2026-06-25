namespace Marketplace.Api.Delivery.DTOs.Auth;

public class AuthResponse
{
    public int Id { get; set; }
    public string Email { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string Rol { get; set; } = null!;
    public string? NivelProfesional { get; set; }
    public int Estado { get; set; }
    public string? Token { get; set; }
}
