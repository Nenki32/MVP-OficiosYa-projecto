namespace Marketplace.Api.Core.Models;

public class CuentaCorriente
{
    public int Id { get; set; }
    public int ProfesionalId { get; set; }
    public int? TrabajoId { get; set; }
    public string Tipo { get; set; } = null!;
    public decimal Monto { get; set; }
    public decimal SaldoPosterior { get; set; }
    public string? Referencia { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public Usuario Profesional { get; set; } = null!;
    public Trabajo? Trabajo { get; set; }
}
