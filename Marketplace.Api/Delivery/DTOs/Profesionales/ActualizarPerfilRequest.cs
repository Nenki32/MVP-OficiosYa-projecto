using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.Delivery.DTOs.Profesionales;

public class ActualizarPerfilRequest
{
    [Required, MaxLength(200)]
    public string Nombre { get; set; } = null!;

    [MaxLength(50)]
    public string? Telefono { get; set; }

    /// <summary>"persona" o "empresa".</summary>
    [Required]
    [AllowedValues("persona", "empresa", ErrorMessage = "El tipo de perfil debe ser persona o empresa.")]
    public string TipoPerfil { get; set; } = "persona";

    /// <summary>Obligatoria si el tipo de perfil es empresa.</summary>
    [MaxLength(200)]
    public string? RazonSocial { get; set; }

    [MaxLength(20)]
    public string? Cuit { get; set; }

    [MaxLength(1000)]
    public string? Descripcion { get; set; }

    [Range(1, 200, ErrorMessage = "El radio de cobertura debe estar entre 1 y 200 km.")]
    public int? RadioCoberturaKm { get; set; }

    public bool Disponible { get; set; } = true;
}

public class ActualizarUbicacionProfesionalRequest
{
    [Required]
    [Range(-90.0, 90.0, ErrorMessage = "La latitud debe estar entre -90 y 90.")]
    public double Latitud { get; set; }

    [Required]
    [Range(-180.0, 180.0, ErrorMessage = "La longitud debe estar entre -180 y 180.")]
    public double Longitud { get; set; }
}

public class ActualizarServiciosRequest
{
    /// <summary>Ids de los rubros en los que trabaja. Reemplaza la lista completa.</summary>
    [Required]
    [MinLength(1, ErrorMessage = "Tenes que elegir al menos un rubro.")]
    public List<int> ServicioIds { get; set; } = [];
}
