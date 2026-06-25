namespace Marketplace.Api.Delivery.DTOs.CuentaCorriente;

public class CuentaCorrienteResponse
{
    public int Id { get; set; }
    public string Tipo { get; set; } = null!;
    public decimal Monto { get; set; }
    public decimal SaldoPosterior { get; set; }
    public string? Referencia { get; set; }
    public int? TrabajoId { get; set; }
    public DateTime CreadoEn { get; set; }
}

public class SaldoResponse
{
    public decimal SaldoActual { get; set; }
}
