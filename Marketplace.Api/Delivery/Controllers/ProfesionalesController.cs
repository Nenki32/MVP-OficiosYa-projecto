using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Marketplace.Api.Core.Interfaces;
using Marketplace.Api.Delivery.DTOs.Profesionales;

namespace Marketplace.Api.Delivery.Controllers;

[ApiController]
[Route("api/profesionales")]
[Authorize(Roles = "profesional")]
public class ProfesionalesController : ControllerBase
{
    private readonly IPerfilProfesionalService _perfil;

    public ProfesionalesController(IPerfilProfesionalService perfil) => _perfil = perfil;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Perfil profesional propio, con rubros y que le falta completar.</summary>
    [HttpGet("me/perfil")]
    public async Task<IActionResult> ObtenerPerfil() =>
        Ok(await _perfil.ObtenerAsync(UserId));

    /// <summary>Datos generales: tipo de perfil, contacto, descripcion y radio.</summary>
    [HttpPut("me/perfil")]
    public async Task<IActionResult> ActualizarPerfil([FromBody] ActualizarPerfilRequest request)
    {
        try
        {
            return Ok(await _perfil.ActualizarAsync(UserId, request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Punto base de trabajo. Llega del GPS del dispositivo; si el usuario no
    /// otorga el permiso, queda sin definir y la busqueda por cercania no aplica.
    /// </summary>
    [HttpPut("me/ubicacion")]
    public async Task<IActionResult> ActualizarUbicacion(
        [FromBody] ActualizarUbicacionProfesionalRequest request) =>
        Ok(await _perfil.ActualizarUbicacionAsync(UserId, request));

    /// <summary>Rubros en los que trabaja. Reemplaza la lista completa.</summary>
    [HttpPut("me/servicios")]
    public async Task<IActionResult> ActualizarServicios(
        [FromBody] ActualizarServiciosRequest request)
    {
        try
        {
            return Ok(await _perfil.ActualizarServiciosAsync(UserId, request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
