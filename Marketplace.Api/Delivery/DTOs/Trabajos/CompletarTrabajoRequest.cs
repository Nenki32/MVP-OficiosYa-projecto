using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.Delivery.DTOs.Trabajos;

public class CompletarTrabajoRequest
{
    [Range(0.01, 9999999.99, ErrorMessage = "El monto debe ser mayor a cero.")]
    public decimal MontoTotal { get; set; }

    [Required]
    [AllowedValues("efectivo", "tarjeta", "transferencia")]
    public string TipoPago { get; set; } = null!;
}
