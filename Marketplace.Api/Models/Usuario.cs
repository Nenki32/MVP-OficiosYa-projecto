using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.Models;

public class Usuario
{
    public int Id { get; set; }

    [Required, MaxLength(255)]
    public string Email { get; set; } = null!;

    [Required, MaxLength(500)]
    public string PasswordHash { get; set; } = null!;

    [Required, MaxLength(200)]
    public string Nombre { get; set; } = null!;

    [MaxLength(50)]
    public string? Telefono { get; set; }

    [Required, MaxLength(20)]
    public string Rol { get; set; } = null!;

    [MaxLength(20)]
    public string? NivelProfesional { get; set; }

    [MaxLength(20)]
    public string? Dni { get; set; }

    [MaxLength(50)]
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
