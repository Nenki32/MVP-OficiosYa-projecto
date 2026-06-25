namespace Marketplace.Api.Core.Models;

public class Pago
{
    public int Id { get; set; }
    public int TrabajoId { get; set; }
    public decimal MontoTotal { get; set; }
    public decimal Comision { get; set; }
    public string TipoPago { get; set; } = null!;
    public string Estado { get; set; } = "registrado";
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public Trabajo Trabajo { get; set; } = null!;
}
