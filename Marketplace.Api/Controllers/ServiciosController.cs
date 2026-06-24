using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Marketplace.Api.Data;

namespace Marketplace.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServiciosController : ControllerBase
{
    private readonly AppDbContext _db;

    public ServiciosController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var servicios = await _db.Servicios
            .OrderBy(s => s.Nombre)
            .Select(s => new { s.Id, s.Nombre, s.Descripcion })
            .ToListAsync();

        return Ok(servicios);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var servicio = await _db.Servicios.FindAsync(id);
        if (servicio == null)
            return NotFound();

        return Ok(new { servicio.Id, servicio.Nombre, servicio.Descripcion });
    }
}
