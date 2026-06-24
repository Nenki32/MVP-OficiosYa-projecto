namespace Marketplace.Api.DTOs.Trabajos;

public class TrabajoDto
{
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public string ClienteNombre { get; set; } = null!;
    public int? ProfesionalId { get; set; }
    public string? ProfesionalNombre { get; set; }
    public int ServicioId { get; set; }
    public string ServicioNombre { get; set; } = null!;
    public string Estado { get; set; } = null!;
    public string TipoPago { get; set; } = null!;
    public decimal? LatitudDestino { get; set; }
    public decimal? LongitudDestino { get; set; }
    public string? DireccionDestino { get; set; }
    public DateTime CreadoEn { get; set; }
}
