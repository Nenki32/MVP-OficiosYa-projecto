namespace Marketplace.Api.Delivery.DTOs.Auth;

public class PerfilResponse
{
    public int Id { get; set; }
    public string Email { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string? Telefono { get; set; }
    public string Rol { get; set; } = null!;
    public string? NivelProfesional { get; set; }
    public int Estado { get; set; }
    public string? NumeroMatricula { get; set; }
}
