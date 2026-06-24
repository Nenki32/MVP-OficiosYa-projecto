using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.DTOs.Trabajos;

public class ActualizarEstadoRequest
{
    [Required]
    public string Estado { get; set; } = null!;
}
