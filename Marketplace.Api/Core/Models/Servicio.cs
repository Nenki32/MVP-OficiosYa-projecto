namespace Marketplace.Api.Core.Models;

public class Servicio
{
    public int Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public ICollection<ProfesionalServicio> Profesionales { get; set; } = new List<ProfesionalServicio>();
}
