using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.Delivery.DTOs.Trabajos;

public class ReprogramarRequest
{
    [Required]
    public DateTime? FechaVisita { get; set; }
}
