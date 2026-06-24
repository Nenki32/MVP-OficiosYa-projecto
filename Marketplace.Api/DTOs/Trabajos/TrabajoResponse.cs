namespace Marketplace.Api.DTOs.Trabajos;

public class TrabajoResponse
{
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public string ClienteNombre { get; set; } = null!;
    public int? ProfesionalId { get; set; }
    public string? ProfesionalNombre { get; set; }
    public int ServicioId { get; set; }
    public string ServicioNombre { get; set; } = null!;
    public string Estado { get; set; } = null!;
    public string? Descripcion { get; set; }
    public string TipoPago { get; set; } = null!;
    public decimal? LatitudDestino { get; set; }
    public decimal? LongitudDestino { get; set; }
    public string? DireccionDestino { get; set; }
    public decimal? LatitudInicio { get; set; }
    public decimal? LongitudInicio { get; set; }
    public DateTime CreadoEn { get; set; }
    public DateTime ActualizadoEn { get; set; }
}
