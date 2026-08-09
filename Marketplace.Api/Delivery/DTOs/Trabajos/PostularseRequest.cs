using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.Delivery.DTOs.Trabajos;

public class PostularseRequest
{
    [Range(0.01, 9999999.99, ErrorMessage = "El presupuesto debe ser mayor a cero.")]
    public decimal? Presupuesto { get; set; }
}
