using Microsoft.EntityFrameworkCore;
using Marketplace.Api.Data;
using Marketplace.Api.DTOs.Trabajos;
using Marketplace.Api.Models;

namespace Marketplace.Api.Services;

public class TrabajoService : ITrabajoService
{
    private readonly AppDbContext _db;

    public TrabajoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<TrabajoResponse> CrearAsync(int clienteId, CrearTrabajoRequest request)
    {
        var trabajo = new Trabajo
        {
            ClienteId = clienteId,
            ServicioId = request.ServicioId,
            Estado = "pendiente",
            Descripcion = request.Descripcion,
            TipoPago = request.TipoPago,
            LatitudDestino = request.LatitudDestino,
            LongitudDestino = request.LongitudDestino,
            DireccionDestino = request.DireccionDestino
        };

        _db.Trabajos.Add(trabajo);
        await _db.SaveChangesAsync();

        return await ObtenerAsync(trabajo.Id);
    }

    public async Task<List<TrabajoResponse>> ListarAsync(int usuarioId, string rol)
    {
        var query = _db.Trabajos
            .Include(t => t.Cliente)
            .Include(t => t.Profesional)
            .Include(t => t.Servicio)
            .AsQueryable();

        if (rol == "cliente")
            query = query.Where(t => t.ClienteId == usuarioId);
        else
            query = query.Where(t => t.ProfesionalId == usuarioId || t.ProfesionalId == null);

        return await query.OrderByDescending(t => t.CreadoEn)
            .Select(t => MapToResponse(t))
            .ToListAsync();
    }

    public async Task<TrabajoResponse> ObtenerAsync(int id)
    {
        var trabajo = await _db.Trabajos
            .Include(t => t.Cliente)
            .Include(t => t.Profesional)
            .Include(t => t.Servicio)
            .FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new KeyNotFoundException("Trabajo no encontrado.");

        return MapToResponse(trabajo);
    }

    public async Task<TrabajoResponse> ActualizarEstadoAsync(int id, int usuarioId, string nuevoEstado)
    {
        var trabajo = await _db.Trabajos.FindAsync(id)
            ?? throw new KeyNotFoundException("Trabajo no encontrado.");

        var transicionesValidas = new Dictionary<string, string[]>
        {
            { "pendiente", new[] { "aceptado", "cancelado" } },
            { "aceptado", new[] { "viajando", "cancelado" } },
            { "viajando", new[] { "en_progreso", "cancelado" } },
            { "en_progreso", new[] { "completado" } }
        };

        if (!transicionesValidas.TryGetValue(trabajo.Estado, out var permitidos) ||
            !permitidos.Contains(nuevoEstado))
            throw new InvalidOperationException(
                $"Transicion invalida: {trabajo.Estado} -> {nuevoEstado}");

        if (nuevoEstado == "aceptado" && trabajo.ProfesionalId == null)
            trabajo.ProfesionalId = usuarioId;
        else if (nuevoEstado == "aceptado" && trabajo.ProfesionalId != usuarioId)
            throw new UnauthorizedAccessException("Otro profesional ya acepto este trabajo.");

        if (nuevoEstado == "cancelado" && trabajo.ProfesionalId != usuarioId && trabajo.ClienteId != usuarioId)
            throw new UnauthorizedAccessException("No puedes cancelar este trabajo.");

        trabajo.Estado = nuevoEstado;
        trabajo.ActualizadoEn = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await ObtenerAsync(id);
    }

    public async Task<TrabajoResponse> ActualizarUbicacionAsync(int id, int usuarioId, ActualizarUbicacionRequest request)
    {
        var trabajo = await _db.Trabajos.FindAsync(id)
            ?? throw new KeyNotFoundException("Trabajo no encontrado.");

        if (trabajo.ProfesionalId != usuarioId)
            throw new UnauthorizedAccessException("Solo el profesional asignado puede actualizar ubicacion.");

        if (trabajo.Estado == "viajando")
        {
            trabajo.LatitudInicio = request.Latitud;
            trabajo.LongitudInicio = request.Longitud;
        }

        trabajo.ActualizadoEn = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await ObtenerAsync(id);
    }

    public async Task<TrabajoResponse> CompletarAsync(int id, int usuarioId, CompletarTrabajoRequest request)
    {
        var trabajo = await _db.Trabajos
            .Include(t => t.Profesional)
            .FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new KeyNotFoundException("Trabajo no encontrado.");

        if (trabajo.ProfesionalId != usuarioId)
            throw new UnauthorizedAccessException("Solo el profesional asignado puede completar el trabajo.");

        if (trabajo.Estado != "en_progreso")
            throw new InvalidOperationException("El trabajo debe estar en_progreso para completarse.");

        trabajo.Estado = "completado";
        trabajo.TipoPago = request.TipoPago;
        trabajo.ActualizadoEn = DateTime.UtcNow;

        var comision = request.MontoTotal * 0.15m;
        var pago = new Pago
        {
            TrabajoId = trabajo.Id,
            MontoTotal = request.MontoTotal,
            Comision = comision,
            TipoPago = request.TipoPago,
            Estado = "registrado"
        };
        _db.Pagos.Add(pago);

        if (request.TipoPago == "efectivo")
        {
            var ultimoSaldo = await _db.CuentaCorriente
                .Where(cc => cc.ProfesionalId == usuarioId)
                .OrderByDescending(cc => cc.CreadoEn)
                .Select(cc => (decimal?)cc.SaldoPosterior)
                .FirstOrDefaultAsync() ?? 0;

            var nuevoSaldo = ultimoSaldo - comision;

            _db.CuentaCorriente.Add(new CuentaCorriente
            {
                ProfesionalId = usuarioId,
                TrabajoId = trabajo.Id,
                Tipo = "comision_adeudada",
                Monto = -comision,
                SaldoPosterior = nuevoSaldo,
                Referencia = $"Comision 15% - Trabajo #{trabajo.Id}"
            });
        }

        await _db.SaveChangesAsync();

        return await ObtenerAsync(id);
    }

    public async Task AsignarProfesionalAsync(int trabajoId, int profesionalId)
    {
        var trabajo = await _db.Trabajos.FindAsync(trabajoId)
            ?? throw new KeyNotFoundException("Trabajo no encontrado.");

        trabajo.ProfesionalId = profesionalId;
        trabajo.Estado = "aceptado";
        trabajo.ActualizadoEn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private static TrabajoResponse MapToResponse(Trabajo t) => new()
    {
        Id = t.Id,
        ClienteId = t.ClienteId,
        ClienteNombre = t.Cliente?.Nombre ?? "",
        ProfesionalId = t.ProfesionalId,
        ProfesionalNombre = t.Profesional?.Nombre,
        ServicioId = t.ServicioId,
        ServicioNombre = t.Servicio?.Nombre ?? "",
        Estado = t.Estado,
        Descripcion = t.Descripcion,
        TipoPago = t.TipoPago,
        LatitudDestino = t.LatitudDestino,
        LongitudDestino = t.LongitudDestino,
        DireccionDestino = t.DireccionDestino,
        LatitudInicio = t.LatitudInicio,
        LongitudInicio = t.LongitudInicio,
        CreadoEn = t.CreadoEn,
        ActualizadoEn = t.ActualizadoEn
    };
}
