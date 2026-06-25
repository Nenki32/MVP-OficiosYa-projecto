using System.ComponentModel.DataAnnotations;

namespace Marketplace.Api.Delivery.DTOs.Auth;

public class RegisterClienteRequest
{
    [Required, EmailAddress, MaxLength(255)]
    public string Email { get; set; } = null!;

    [Required, MinLength(6), MaxLength(100)]
    public string Password { get; set; } = null!;

    [Required, MaxLength(200)]
    public string Nombre { get; set; } = null!;

    [MaxLength(50)]
    public string? Telefono { get; set; }

    [MaxLength(20)]
    public string? Dni { get; set; }
}
