using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.DTOs.Auth;

public class RegisterRequest
{
    [Required, EmailAddress, MaxLength(255)]
    public string Email { get; set; } = null!;

    [Required, MinLength(6), MaxLength(100)]
    public string Password { get; set; } = null!;

    [Required, MaxLength(200)]
    public string Nombre { get; set; } = null!;

    [MaxLength(50)]
    public string? Telefono { get; set; }

    [Required]
    public string Rol { get; set; } = null!;

    public string? NivelProfesional { get; set; }

    public string? Dni { get; set; }

    public string? NumeroMatricula { get; set; }
}
