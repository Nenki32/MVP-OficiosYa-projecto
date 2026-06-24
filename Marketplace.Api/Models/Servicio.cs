using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.Models;

public class Servicio
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Nombre { get; set; } = null!;

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public ICollection<ProfesionalServicio> Profesionales { get; set; } = new List<ProfesionalServicio>();
    public ICollection<Trabajo> Trabajos { get; set; } = new List<Trabajo>();
}
