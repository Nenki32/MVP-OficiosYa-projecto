namespace Marketplace.Api.Delivery.DTOs.Profesionales;

/// <summary>Perfil completo del profesional, tal como lo ve el propio dueño.</summary>
public class PerfilProfesionalDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Telefono { get; set; }

    // Persona o empresa
    public string TipoPerfil { get; set; } = null!;
    public string? RazonSocial { get; set; }
    public string? Cuit { get; set; }

    // Credencial
    public string? NivelProfesional { get; set; }
    public string? NumeroMatricula { get; set; }

    public string? Descripcion { get; set; }

    // Zona de trabajo. Nulas mientras no se otorgue el permiso de ubicacion.
    public double? Latitud { get; set; }
    public double? Longitud { get; set; }
    public int? RadioCoberturaKm { get; set; }
    public bool Disponible { get; set; }

    public List<ServicioDelProfesionalDto> Servicios { get; set; } = [];

    /// <summary>
    /// Que le falta al perfil para poder recibir trabajos. Vacio = esta completo.
    /// Se calcula en el servidor para que app y web muestren lo mismo.
    /// </summary>
    public List<string> Faltantes { get; set; } = [];
}

public class ServicioDelProfesionalDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = null!;
}
