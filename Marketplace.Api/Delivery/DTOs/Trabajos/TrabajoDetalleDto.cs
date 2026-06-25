namespace Marketplace.Api.Delivery.DTOs.Trabajos;

public class TrabajoDetalleDto : TrabajoDto
{
    public string? Descripcion { get; set; }
    public decimal? LatitudInicio { get; set; }
    public decimal? LongitudInicio { get; set; }
    public PagoInfo? Pago { get; set; }
    public ReseniaInfo? Resenia { get; set; }
    public List<PostulacionDto> Postulaciones { get; set; } = new();
    public DateTime ActualizadoEn { get; set; }
}

public class PagoInfo
{
    public decimal MontoTotal { get; set; }
    public decimal Comision { get; set; }
    public string TipoPago { get; set; } = null!;
    public string Estado { get; set; } = null!;
}

public class ReseniaInfo
{
    public byte Puntuacion { get; set; }
    public string? Comentario { get; set; }
    public string? ClienteNombre { get; set; }
}
