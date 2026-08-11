namespace Marketplace.Api.Core.Models;

/// <summary>
/// Un trabajo junto con su distancia al profesional que consulta.
/// La distancia la calcula la base con PostGIS: traer todo y medir en memoria
/// no escala y ademas impide filtrar por radio con indice.
/// </summary>
public class TrabajoConDistancia
{
    public Trabajo Trabajo { get; set; } = null!;

    /// <summary>Metros hasta el profesional. Null si alguno no tiene ubicacion.</summary>
    public double? DistanciaMetros { get; set; }
}
