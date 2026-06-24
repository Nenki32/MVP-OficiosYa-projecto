using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Marketplace.Api.Models;

public class CuentaCorriente
{
    public int Id { get; set; }

    public int ProfesionalId { get; set; }
    public int? TrabajoId { get; set; }

    [Required, MaxLength(30)]
    public string Tipo { get; set; } = null!;

    [Column(TypeName = "decimal(10,2)")]
    public decimal Monto { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal SaldoPosterior { get; set; }

    [MaxLength(500)]
    public string? Referencia { get; set; }

    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public Usuario Profesional { get; set; } = null!;
    public Trabajo? Trabajo { get; set; }
}
