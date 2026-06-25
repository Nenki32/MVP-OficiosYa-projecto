using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.Delivery.DTOs.Resenias;

public class CrearReseniaRequest
{
    [Required, Range(1, 5)]
    public byte Puntuacion { get; set; }

    [MaxLength(1000)]
    public string? Comentario { get; set; }
}
