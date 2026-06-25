using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.Delivery.DTOs.Trabajos;

public class ActualizarEstadoRequest
{
    [Required]
    public string Estado { get; set; } = null!;
}
