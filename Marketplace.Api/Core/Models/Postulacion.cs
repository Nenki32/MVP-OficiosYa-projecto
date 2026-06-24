namespace Marketplace.Api.Core.Models;

public class Postulacion
{
    public int Id { get; set; }
    public int TrabajoId { get; set; }
    public int ProfesionalId { get; set; }
    public decimal? Presupuesto { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public Trabajo Trabajo { get; set; } = null!;
    public Usuario Profesional { get; set; } = null!;
}
