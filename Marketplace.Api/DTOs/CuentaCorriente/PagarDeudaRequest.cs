using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.DTOs.CuentaCorriente;

public class PagarDeudaRequest
{
    [Required, Range(0.01, 9999999.99)]
    public decimal Monto { get; set; }
}
