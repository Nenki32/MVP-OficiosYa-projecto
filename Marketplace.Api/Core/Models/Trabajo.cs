using NetTopologySuite.Geometries;

namespace Marketplace.Api.Core.Models;

public class Trabajo
{
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public int? ProfesionalId { get; set; }
    public int ServicioId { get; set; }
    public string Estado { get; set; } = "pendiente";
    public string? Descripcion { get; set; }
    public string TipoPago { get; set; } = "efectivo";

    /// <summary>
    /// Donde se realiza el trabajo, en SRID 4326. Reemplaza a las columnas
    /// decimales de latitud y longitud: con un tipo geografico la distancia y
    /// el filtrado por radio se resuelven en la base, con indice, en vez de
    /// traer todas las filas y calcular en memoria.
    /// </summary>
    public Point? Ubicacion { get; set; }

    public string? DireccionDestino { get; set; }
    public decimal? LatitudInicio { get; set; }
    public decimal? LongitudInicio { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    public Usuario Cliente { get; set; } = null!;
    public Usuario? Profesional { get; set; }
    public Servicio Servicio { get; set; } = null!;
    public Pago? Pago { get; set; }
    public Resenia? Resenia { get; set; }
    public ICollection<Postulacion> Postulaciones { get; set; } = new List<Postulacion>();
    public ICollection<CuentaCorriente> CuentaCorriente { get; set; } = new List<CuentaCorriente>();
}
