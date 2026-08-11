using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Marketplace.Api.Infrastructure.Data;

namespace Marketplace.Api.Delivery.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db) => _db = db;

    [HttpGet("usuarios")]
    public async Task<IActionResult> ListarUsuarios()
    {
        try
        {
            var usuarios = await _db.Usuarios
                .OrderBy(u => u.CreadoEn)
                .Select(u => new
                {
                    u.Id, u.Email, u.Nombre, u.Telefono, u.Rol,
                    u.NivelProfesional, u.Estado, u.CreadoEn
                })
                .ToListAsync();
            return Ok(usuarios);
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "Error interno del servidor" });
        }
    }

    [HttpGet("usuarios/{id}")]
    public async Task<IActionResult> ObtenerUsuario(int id)
    {
        try
        {
            var usuario = await _db.Usuarios
                .Where(u => u.Id == id)
                .Select(u => new
                {
                    u.Id, u.Email, u.Nombre, u.Telefono, u.Rol,
                    u.NivelProfesional, u.NumeroMatricula, u.Estado,
                    u.CreadoEn, u.ActualizadoEn
                })
                .FirstOrDefaultAsync();
            if (usuario == null)
                return NotFound(new { error = "Usuario no encontrado." });
            return Ok(usuario);
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "Error interno del servidor" });
        }
    }

    [HttpGet("trabajos")]
    public async Task<IActionResult> ListarTrabajos()
    {
        try
        {
            var trabajos = await _db.Trabajos
                .Include(t => t.Cliente)
                .Include(t => t.Profesional)
                .Include(t => t.Servicio)
                .OrderByDescending(t => t.CreadoEn)
                .Select(t => new
                {
                    t.Id, Cliente = t.Cliente.Nombre,
                    Profesional = t.Profesional != null ? t.Profesional.Nombre : null,
                    Servicio = t.Servicio.Nombre, t.Estado, t.TipoPago,
                    Latitud = t.Ubicacion != null ? t.Ubicacion.Y : (double?)null,
                    Longitud = t.Ubicacion != null ? t.Ubicacion.X : (double?)null,
                    t.DireccionDestino,
                    t.CreadoEn, t.ActualizadoEn
                })
                .ToListAsync();
            return Ok(trabajos);
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "Error interno del servidor" });
        }
    }

    [HttpGet("trabajos/{id}")]
    public async Task<IActionResult> ObtenerTrabajo(int id)
    {
        try
        {
            var trabajo = await _db.Trabajos
                .Include(t => t.Cliente)
                .Include(t => t.Profesional)
                .Include(t => t.Servicio)
                .Include(t => t.Pago)
                .Include(t => t.Resenia)
                .Where(t => t.Id == id)
                .Select(t => new
                {
                    t.Id,
                    Cliente = new { t.Cliente.Id, t.Cliente.Nombre, t.Cliente.Email },
                    Profesional = t.Profesional != null
                        ? new { t.Profesional.Id, t.Profesional.Nombre, t.Profesional.Email }
                        : null,
                    Servicio = t.Servicio.Nombre, t.Estado, t.Descripcion, t.TipoPago,
                    Latitud = t.Ubicacion != null ? t.Ubicacion.Y : (double?)null,
                    Longitud = t.Ubicacion != null ? t.Ubicacion.X : (double?)null,
                    t.DireccionDestino,
                    t.LatitudInicio, t.LongitudInicio,
                    Pago = t.Pago != null
                        ? new { t.Pago.MontoTotal, t.Pago.Comision, t.Pago.TipoPago, t.Pago.Estado }
                        : null,
                    Resenia = t.Resenia != null
                        ? new { t.Resenia.Puntuacion, t.Resenia.Comentario }
                        : null,
                    t.CreadoEn, t.ActualizadoEn
                })
                .FirstOrDefaultAsync();
            if (trabajo == null)
                return NotFound(new { error = "Trabajo no encontrado." });
            return Ok(trabajo);
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "Error interno del servidor" });
        }
    }

    [HttpGet("resenias")]
    public async Task<IActionResult> ListarResenias()
    {
        try
        {
            var resenias = await _db.Resenias
                .Include(r => r.Cliente)
                .Include(r => r.Profesional)
                .Include(r => r.Trabajo)
                .OrderByDescending(r => r.CreadoEn)
                .Select(r => new
                {
                    r.Id, Cliente = r.Cliente.Nombre,
                    Profesional = r.Profesional.Nombre,
                    r.Puntuacion, r.Comentario,
                    TrabajoId = r.Trabajo.Id, r.CreadoEn
                })
                .ToListAsync();
            return Ok(resenias);
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "Error interno del servidor" });
        }
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        try
        {
            var totalClientes = await _db.Usuarios.CountAsync(u => u.Rol == "cliente");
            var totalProfesionales = await _db.Usuarios.CountAsync(u => u.Rol == "profesional");
            var totalTrabajos = await _db.Trabajos.CountAsync();
            var trabajosPendientes = await _db.Trabajos.CountAsync(t => t.Estado == "pendiente");
            var trabajosCompletados = await _db.Trabajos.CountAsync(t => t.Estado == "completado");
            var comisionesPendientes = await _db.CuentaCorriente
                .OrderByDescending(cc => cc.CreadoEn)
                .Select(cc => (decimal?)cc.SaldoPosterior)
                .FirstOrDefaultAsync() ?? 0;

            return Ok(new
            {
                totalClientes, totalProfesionales, totalTrabajos,
                trabajosPendientes, trabajosCompletados, comisionesPendientes
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "Error interno del servidor" });
        }
    }
}
