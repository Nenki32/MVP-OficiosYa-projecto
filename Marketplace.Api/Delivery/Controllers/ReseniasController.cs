using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Marketplace.Api.Core.Models;
using Marketplace.Api.Delivery.DTOs.Resenias;
using Marketplace.Api.Infrastructure.Data;

namespace Marketplace.Api.Delivery.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class ReseniasController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReseniasController(AppDbContext db) => _db = db;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("trabajos/{trabajoId}/resenia")]
    public async Task<IActionResult> Crear(int trabajoId, [FromBody] CrearReseniaRequest request)
    {
        try
        {
            var trabajo = await _db.Trabajos.FindAsync(trabajoId);
            if (trabajo == null)
                return NotFound(new { error = "Trabajo no encontrado." });
            if (trabajo.ClienteId != UserId)
                return Forbid();
            if (trabajo.Estado != "completado")
                return BadRequest(new { error = "Solo se puede reseñar un trabajo completado." });
            if (await _db.Resenias.AnyAsync(r => r.TrabajoId == trabajoId))
                return Conflict(new { error = "Este trabajo ya tiene una reseña." });

            var resenia = new Resenia
            {
                TrabajoId = trabajoId,
                ClienteId = UserId,
                ProfesionalId = trabajo.ProfesionalId!.Value,
                Puntuacion = request.Puntuacion,
                Comentario = request.Comentario
            };

            _db.Resenias.Add(resenia);
            await _db.SaveChangesAsync();

            return Ok(new { resenia.Id, resenia.Puntuacion, resenia.Comentario, resenia.CreadoEn });
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "Error interno del servidor" });
        }
    }

    [HttpGet("profesionales/{profesionalId}/resenias")]
    public async Task<IActionResult> Listar(int profesionalId)
    {
        try
        {
            var resenias = await _db.Resenias
                .Where(r => r.ProfesionalId == profesionalId)
                .OrderByDescending(r => r.CreadoEn)
                .Select(r => new
                {
                    r.Id, r.Puntuacion, r.Comentario,
                    ClienteNombre = r.Cliente.Nombre, r.CreadoEn
                })
                .ToListAsync();
            return Ok(resenias);
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "Error interno del servidor" });
        }
    }
}
