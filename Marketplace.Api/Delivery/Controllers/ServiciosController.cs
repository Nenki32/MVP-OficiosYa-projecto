using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Marketplace.Api.Infrastructure.Data;

namespace Marketplace.Api.Delivery.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServiciosController : ControllerBase
{
    private readonly AppDbContext _db;

    public ServiciosController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var servicios = await _db.Servicios
                .OrderBy(s => s.Nombre)
                .Select(s => new { s.Id, s.Nombre, s.Descripcion })
                .ToListAsync();
            return Ok(servicios);
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "Error interno del servidor" });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var servicio = await _db.Servicios.FindAsync(id);
            if (servicio == null)
                return NotFound(new { error = "Servicio no encontrado." });
            return Ok(new { servicio.Id, servicio.Nombre, servicio.Descripcion });
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "Error interno del servidor" });
        }
    }
}
