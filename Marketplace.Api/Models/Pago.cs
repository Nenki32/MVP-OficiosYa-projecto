using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Marketplace.Api.Models;

public class Pago
{
    public int Id { get; set; }

    public int TrabajoId { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal MontoTotal { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Comision { get; set; }

    [Required, MaxLength(20)]
    public string TipoPago { get; set; } = null!;

    [Required, MaxLength(20)]
    public string Estado { get; set; } = "registrado";

    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    public Trabajo Trabajo { get; set; } = null!;
}
