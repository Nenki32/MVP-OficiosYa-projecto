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

    /// <summary>
    /// Dia y hora que el cliente propone para la visita.
    ///
    /// Es una PROPUESTA, no una reserva: al publicar todavia no hay profesional
    /// asignado, asi que no hay agenda que ocupar. Se convierte en turno cuando
    /// un profesional acepta el trabajo.
    /// </summary>
    public DateTime? FechaVisita { get; set; }

    /// <summary>Duracion estimada en minutos. Por ahora, franjas de una hora.</summary>
    public int? DuracionEstimadaMin { get; set; }
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

    /// <summary>Dias despues de la fecha de visita en que un pendiente pasa a "a_reprogramar".</summary>
    public const int DiasParaReprogramar = 3;

    /// <summary>
    /// Pendiente (ningun presupuesto aceptado) cuya fecha paso hace mas de
    /// <see cref="DiasParaReprogramar"/> dias. No se guarda en la base: se
    /// calcula al leer, asi no hace falta un proceso que lo actualice.
    /// </summary>
    public bool ParaReprogramar(DateTime ahoraUtc) =>
        Estado == "pendiente" && FechaVisita < ahoraUtc.AddDays(-DiasParaReprogramar);

    /// <summary>El estado que ven cliente y profesional.</summary>
    public string EstadoVisible(DateTime ahoraUtc) =>
        ParaReprogramar(ahoraUtc) ? "a_reprogramar" : Estado;
}
