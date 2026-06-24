using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.Delivery.DTOs.Trabajos;

public class CompletarTrabajoRequest
{
    [Required, Range(0, 9999999.99)]
    public decimal MontoTotal { get; set; }

    [Required]
    public string TipoPago { get; set; } = null!;
}
