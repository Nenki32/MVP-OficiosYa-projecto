using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Marketplace.Api.Core.Interfaces;
using Marketplace.Api.Core.Models;
using Marketplace.Api.Delivery.DTOs.Trabajos;
using Marketplace.Api.Infrastructure.Data;

namespace Marketplace.Api.Delivery.Controllers;

[ApiController]
[Route("api/trabajos")]
[Authorize]
public class TrabajosController : ControllerBase
{
    private readonly ITrabajoService _service;
    private readonly AppDbContext _db;
    private readonly IPostulacionRepository _postulacionRepo;

    public TrabajosController(ITrabajoService service, AppDbContext db, IPostulacionRepository postulacionRepo)
    {
        _service = service;
        _db = db;
        _postulacionRepo = postulacionRepo;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string UserRol => User.FindFirstValue(ClaimTypes.Role)!;

    [HttpPost]
    public async Task<IActionResult> Solicitar([FromBody] CrearTrabajoRequest request)
    {
        if (UserRol != "cliente") return Forbid();
        var response = await _service.CrearAsync(UserId, request);
        return CreatedAtAction(nameof(Obtener), new { id = response.Id }, response);
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var trabajos = await _service.ListarAsync(UserId, UserRol);
        return Ok(trabajos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Obtener(int id)
    {
        try
        {
            var trabajo = await _service.ObtenerAsync(id);
            return Ok(trabajo);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Trabajo no encontrado." });
        }
    }

    [HttpPatch("{id}/estado")]
    public async Task<IActionResult> ActualizarEstado(int id, [FromBody] ActualizarEstadoRequest request)
    {
        try
        {
            var response = await _service.ActualizarEstadoAsync(id, UserId, request.Estado);
            return Ok(response);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Trabajo no encontrado." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPatch("{id}/ubicacion")]
    public async Task<IActionResult> ActualizarUbicacion(int id, [FromBody] ActualizarUbicacionRequest request)
    {
        try
        {
            var response = await _service.ActualizarUbicacionAsync(id, UserId, request);
            return Ok(response);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Trabajo no encontrado." });
        }
    }

    [HttpPost("{id}/completar")]
    public async Task<IActionResult> Completar(int id, [FromBody] CompletarTrabajoRequest request)
    {
        try
        {
            var response = await _service.CompletarAsync(id, UserId, request);
            return Ok(response);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Trabajo no encontrado." });
        }
    }

    [HttpPost("{id}/postularse")]
    public async Task<IActionResult> Postularse(int id, [FromBody] PostularseRequest? request)
    {
        if (UserRol != "profesional") return Forbid();

        var trabajo = await _db.Trabajos.FindAsync(id);
        if (trabajo == null)
            return NotFound(new { error = "Trabajo no encontrado." });
        if (trabajo.Estado != "pendiente")
            return BadRequest(new { error = "Este trabajo ya no acepta postulaciones." });
        if (trabajo.ClienteId == UserId)
            return BadRequest(new { error = "No podes postularte a tu propio trabajo." });

        var yaPostulado = await _postulacionRepo.ExistsAsync(id, UserId);
        if (yaPostulado)
            return Conflict(new { error = "Ya te postulaste a este trabajo." });

        await _postulacionRepo.AddAsync(new Postulacion
        {
            TrabajoId = id,
            ProfesionalId = UserId,
            Presupuesto = request?.Presupuesto
        });

        return Ok(new { message = "Te postulaste correctamente." });
    }

    [HttpGet("{id}/postulaciones")]
    public async Task<IActionResult> ListarPostulaciones(int id)
    {
        var trabajo = await _db.Trabajos.FindAsync(id);
        if (trabajo == null)
            return NotFound(new { error = "Trabajo no encontrado." });
        if (trabajo.ClienteId != UserId && UserRol != "admin")
            return Forbid();

        var postulaciones = await _postulacionRepo.GetByTrabajoAsync(id);
        var dtos = postulaciones.Select(p => new PostulacionDto
        {
            Id = p.Id,
            ProfesionalId = p.ProfesionalId,
            ProfesionalNombre = p.Profesional.Nombre,
            NivelProfesional = p.Profesional.NivelProfesional,
            Presupuesto = p.Presupuesto,
            CreadoEn = p.CreadoEn
        }).ToList();

        return Ok(dtos);
    }

    [HttpPost("{id}/asignar/{profesionalId}")]
    public async Task<IActionResult> Asignar(int id, int profesionalId)
    {
        if (UserRol != "cliente") return Forbid();

        var trabajo = await _db.Trabajos.FindAsync(id);
        if (trabajo == null)
            return NotFound(new { error = "Trabajo no encontrado." });
        if (trabajo.ClienteId != UserId) return Forbid();
        if (trabajo.Estado != "pendiente")
            return BadRequest(new { error = "El trabajo ya tiene un profesional asignado." });

        var postulado = await _postulacionRepo.ExistsAsync(id, profesionalId);
        if (!postulado)
            return BadRequest(new { error = "Ese profesional no se postulo a este trabajo." });

        await _service.AsignarProfesionalAsync(id, profesionalId);

        return Ok(new { message = "Profesional asignado correctamente." });
    }
}
