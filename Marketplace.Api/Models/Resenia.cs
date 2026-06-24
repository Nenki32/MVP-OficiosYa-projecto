using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.Models;

public class Resenia
{
    public int Id { get; set; }

    public int TrabajoId { get; set; }
    public int ClienteId { get; set; }
    public int ProfesionalId { get; set; }

    [Range(1, 5)]
    public byte Puntuacion { get; set; }

    [MaxLength(1000)]
    public string? Comentario { get; set; }

    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public Trabajo Trabajo { get; set; } = null!;
    public Usuario Cliente { get; set; } = null!;
    public Usuario Profesional { get; set; } = null!;
}
