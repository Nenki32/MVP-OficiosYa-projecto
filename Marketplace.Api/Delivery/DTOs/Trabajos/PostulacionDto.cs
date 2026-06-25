namespace Marketplace.Api.Delivery.DTOs.Trabajos;

public class PostulacionDto
{
    public int Id { get; set; }
    public int ProfesionalId { get; set; }
    public string ProfesionalNombre { get; set; } = null!;
    public string? NivelProfesional { get; set; }
    public decimal? Presupuesto { get; set; }
    public DateTime CreadoEn { get; set; }
}
