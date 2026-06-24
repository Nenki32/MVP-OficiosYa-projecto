namespace Marketplace.Api.Models;

public class ProfesionalServicio
{
    public int ProfesionalId { get; set; }
    public int ServicioId { get; set; }

    public Usuario Profesional { get; set; } = null!;
    public Servicio Servicio { get; set; } = null!;
}
