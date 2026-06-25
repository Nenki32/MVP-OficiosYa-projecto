using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.Delivery.DTOs.Trabajos;

public class CrearTrabajoRequest
{
    [Required]
    public int ServicioId { get; set; }

    [MaxLength(1000)]
    public string? Descripcion { get; set; }

    public string TipoPago { get; set; } = "efectivo";

    public decimal? LatitudDestino { get; set; }
    public decimal? LongitudDestino { get; set; }

    [MaxLength(500)]
    public string? DireccionDestino { get; set; }
}
