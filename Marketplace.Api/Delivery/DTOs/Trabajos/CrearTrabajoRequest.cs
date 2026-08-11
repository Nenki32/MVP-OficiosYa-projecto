using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.Delivery.DTOs.Trabajos;

public class CrearTrabajoRequest
{
    // [Required] sobre un int no anulable no valida nada: siempre trae 0 por defecto.
    [Range(1, int.MaxValue, ErrorMessage = "Debe indicar un servicio valido.")]
    public int ServicioId { get; set; }

    [MaxLength(1000)]
    public string? Descripcion { get; set; }

    [AllowedValues("efectivo", "tarjeta", "transferencia")]
    public string TipoPago { get; set; } = "efectivo";

    [Range(-90.0, 90.0, ErrorMessage = "La latitud debe estar entre -90 y 90.")]
    public double? LatitudDestino { get; set; }

    [Range(-180.0, 180.0, ErrorMessage = "La longitud debe estar entre -180 y 180.")]
    public double? LongitudDestino { get; set; }

    [MaxLength(500)]
    public string? DireccionDestino { get; set; }

    /// <summary>
    /// Dia y hora propuestos para la visita. Opcional: un pedido urgente puede
    /// publicarse sin fecha y coordinarse despues.
    /// </summary>
    public DateTime? FechaVisita { get; set; }
}
