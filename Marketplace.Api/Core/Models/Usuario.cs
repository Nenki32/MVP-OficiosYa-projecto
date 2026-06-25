namespace Marketplace.Api.Core.Models;

public class Usuario
{
    public int Id { get; set; }
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string? Telefono { get; set; }
    public string Rol { get; set; } = null!;
    public string? NivelProfesional { get; set; }
    public string? Dni { get; set; }
    public string? NumeroMatricula { get; set; }
    public int Estado { get; set; } = (int)EstadoUsuario.Activo;
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    public ICollection<Trabajo> TrabajosComoCliente { get; set; } = new List<Trabajo>();
    public ICollection<Trabajo> TrabajosComoProfesional { get; set; } = new List<Trabajo>();
    public ICollection<CuentaCorriente> CuentaCorriente { get; set; } = new List<CuentaCorriente>();
    public ICollection<Resenia> ReseniasRecibidas { get; set; } = new List<Resenia>();
    public ICollection<Resenia> ReseniasEscritas { get; set; } = new List<Resenia>();
    public ICollection<ProfesionalServicio> Servicios { get; set; } = new List<ProfesionalServicio>();
}
