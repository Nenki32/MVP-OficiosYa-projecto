using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Marketplace.Api.DTOs.Trabajos;
using Marketplace.Api.Services;

namespace Marketplace.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TrabajosController : ControllerBase
{
    private readonly ITrabajoService _trabajoService;

    public TrabajosController(ITrabajoService trabajoService) => _trabajoService = trabajoService;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string UserRol => User.FindFirstValue(ClaimTypes.Role)!;

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearTrabajoRequest request)
    {
        if (UserRol != "cliente")
            return Forbid();

        try
        {
            var response = await _trabajoService.CrearAsync(UserId, request);
            return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var trabajos = await _trabajoService.ListarAsync(UserId, UserRol);
        return Ok(trabajos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var response = await _trabajoService.ObtenerAsync(id);
            return Ok(response);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPatch("{id}/estado")]
    public async Task<IActionResult> ActualizarEstado(int id, [FromBody] ActualizarEstadoRequest request)
    {
        try
        {
            var response = await _trabajoService.ActualizarEstadoAsync(id, UserId, request.Estado);
            return Ok(response);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPatch("{id}/ubicacion")]
    public async Task<IActionResult> ActualizarUbicacion(int id, [FromBody] ActualizarUbicacionRequest request)
    {
        try
        {
            var response = await _trabajoService.ActualizarUbicacionAsync(id, UserId, request);
            return Ok(response);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{id}/completar")]
    public async Task<IActionResult> Completar(int id, [FromBody] CompletarTrabajoRequest request)
    {
        try
        {
            var response = await _trabajoService.CompletarAsync(id, UserId, request);
            return Ok(response);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }
}
