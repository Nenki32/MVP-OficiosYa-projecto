using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Marketplace.Api.Models;

public class Trabajo
{
    public int Id { get; set; }

    public int ClienteId { get; set; }
    public int? ProfesionalId { get; set; }
    public int ServicioId { get; set; }

    [Required, MaxLength(20)]
    public string Estado { get; set; } = "pendiente";

    [MaxLength(1000)]
    public string? Descripcion { get; set; }

    [Required, MaxLength(20)]
    public string TipoPago { get; set; } = "efectivo";

    [Column(TypeName = "decimal(10,7)")]
    public decimal? LatitudDestino { get; set; }

    [Column(TypeName = "decimal(10,7)")]
    public decimal? LongitudDestino { get; set; }

    [MaxLength(500)]
    public string? DireccionDestino { get; set; }

    [Column(TypeName = "decimal(10,7)")]
    public decimal? LatitudInicio { get; set; }

    [Column(TypeName = "decimal(10,7)")]
    public decimal? LongitudInicio { get; set; }

    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    public Usuario Cliente { get; set; } = null!;
    public Usuario? Profesional { get; set; }
    public Servicio Servicio { get; set; } = null!;
    public Pago? Pago { get; set; }
    public Resenia? Resenia { get; set; }
    public ICollection<CuentaCorriente> CuentaCorriente { get; set; } = new List<CuentaCorriente>();
}
