namespace Marketplace.Api.Delivery.DTOs.Trabajos;

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
    public double? LatitudDestino { get; set; }
    public double? LongitudDestino { get; set; }
    public string? DireccionDestino { get; set; }

    /// <summary>
    /// Distancia en kilometros entre el trabajo y el profesional que consulta.
    /// Null si alguno de los dos no tiene ubicacion, o si quien consulta no es
    /// un profesional.
    /// </summary>
    public double? DistanciaKm { get; set; }

    public DateTime CreadoEn { get; set; }
}
