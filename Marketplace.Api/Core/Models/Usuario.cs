using NetTopologySuite.Geometries;

namespace Marketplace.Api.Core.Models;

public class Usuario
{
    public int Id { get; set; }
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string? Telefono { get; set; }
    public string Rol { get; set; } = null!;
    public string? NivelProfesional { get; set; }
    public string? Dni { get; set; }
    public string? NumeroMatricula { get; set; }
    public int Estado { get; set; } = (int)EstadoUsuario.Activo;

    // ---- Tipo de perfil -----------------------------------------------
    // Es ORTOGONAL al rol: tanto un cliente como un profesional pueden ser
    // una empresa. Un consorcio puede contratar servicios, y una empresa de
    // instalaciones puede ofrecerlos.
    public string TipoPerfil { get; set; } = TiposPerfil.Persona;

    /// <summary>Razon social. Solo para perfiles de tipo empresa.</summary>
    public string? RazonSocial { get; set; }

    /// <summary>CUIT. Solo para perfiles de tipo empresa.</summary>
    public string? Cuit { get; set; }

    // ---- Perfil profesional -------------------------------------------
    /// <summary>Descripcion libre: experiencia, especialidades, forma de trabajo.</summary>
    public string? Descripcion { get; set; }

    /// <summary>
    /// Punto base desde donde trabaja, en SRID 4326 (lat/lng).
    /// Sale del GPS del dispositivo; no hay tabla de localidades precargadas.
    /// Es null mientras el profesional no otorgue el permiso de ubicacion.
    /// </summary>
    public Point? Ubicacion { get; set; }

    /// <summary>Radio de accion en kilometros desde <see cref="Ubicacion"/>.</summary>
    public int? RadioCoberturaKm { get; set; }

    /// <summary>Si esta recibiendo trabajos. Permite pausar sin darse de baja.</summary>
    public bool Disponible { get; set; } = true;

    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    public ICollection<Trabajo> TrabajosComoCliente { get; set; } = new List<Trabajo>();
    public ICollection<Trabajo> TrabajosComoProfesional { get; set; } = new List<Trabajo>();
    public ICollection<CuentaCorriente> CuentaCorriente { get; set; } = new List<CuentaCorriente>();
    public ICollection<Resenia> ReseniasRecibidas { get; set; } = new List<Resenia>();
    public ICollection<Resenia> ReseniasEscritas { get; set; } = new List<Resenia>();
    public ICollection<ProfesionalServicio> Servicios { get; set; } = new List<ProfesionalServicio>();
}
