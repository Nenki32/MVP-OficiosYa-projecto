using Microsoft.EntityFrameworkCore;
using Marketplace.Api.Core.Interfaces;
using Marketplace.Api.Core.Models;

namespace Marketplace.Api.Infrastructure.Data.Repositories;

public class TrabajoRepository : ITrabajoRepository
{
    private readonly AppDbContext _db;

    public TrabajoRepository(AppDbContext db) => _db = db;

    public async Task<Trabajo?> GetByIdAsync(int id) =>
        await _db.Trabajos.FindAsync(id);

    public async Task<Trabajo?> GetByIdWithAllAsync(int id) =>
        await _db.Trabajos
            .Include(t => t.Cliente)
            .Include(t => t.Profesional)
            .Include(t => t.Servicio)
            .Include(t => t.Pago)
            .Include(t => t.Resenia!)
                .ThenInclude(r => r.Cliente)
            .Include(t => t.Postulaciones)
                .ThenInclude(p => p.Profesional)
            .FirstOrDefaultAsync(t => t.Id == id);

    public async Task<List<Trabajo>> GetByClienteAsync(int clienteId) =>
        await _db.Trabajos
            .Include(t => t.Cliente)
            .Include(t => t.Profesional)
            .Include(t => t.Servicio)
            .Where(t => t.ClienteId == clienteId)
            .OrderByDescending(t => t.CreadoEn)
            .ToListAsync();

    public async Task<List<Trabajo>> GetByProfesionalAsync(int profesionalId) =>
        await _db.Trabajos
            .Include(t => t.Cliente)
            .Include(t => t.Profesional)
            .Include(t => t.Servicio)
            .Where(t => t.ProfesionalId == profesionalId || t.ProfesionalId == null)
            .OrderByDescending(t => t.CreadoEn)
            .ToListAsync();

    public async Task<List<TrabajoConDistancia>> GetParaProfesionalAsync(int profesionalId)
    {
        var profesional = await _db.Usuarios
            .Include(u => u.Servicios)
            .FirstOrDefaultAsync(u => u.Id == profesionalId);

        if (profesional is null) return [];

        var rubros = profesional.Servicios.Select(ps => ps.ServicioId).ToList();
        var ubicacion = profesional.Ubicacion;
        var radioMetros = profesional.RadioCoberturaKm * 1000d;

        var query = _db.Trabajos
            .Include(t => t.Cliente)
            .Include(t => t.Profesional)
            .Include(t => t.Servicio)
            // Los trabajos propios se ven siempre, sin importar rubro ni radio:
            // ya los tomo, no tendria sentido esconderlos si movio su zona.
            .Where(t => t.ProfesionalId == profesionalId ||
                        (t.ProfesionalId == null && t.Estado == "pendiente"));

        if (rubros.Count > 0)
            query = query.Where(t => t.ProfesionalId == profesionalId ||
                                     rubros.Contains(t.ServicioId));

        if (ubicacion is not null && radioMetros is not null)
            query = query.Where(t => t.ProfesionalId == profesionalId ||
                                     // Un trabajo sin coordenadas se muestra igual.
                                     // Si se filtrara, un cliente que niega el permiso
                                     // de ubicacion publicaria en el vacio: su pedido
                                     // no le llegaria a nadie y nadie se enteraria.
                                     t.Ubicacion == null ||
                                     t.Ubicacion.Distance(ubicacion) <= radioMetros);

        return await query
            .Select(t => new TrabajoConDistancia
            {
                Trabajo = t,
                DistanciaMetros = ubicacion != null && t.Ubicacion != null
                    ? t.Ubicacion.Distance(ubicacion)
                    : null,
            })
            .OrderBy(x => x.DistanciaMetros ?? double.MaxValue)
            .ThenByDescending(x => x.Trabajo.CreadoEn)
            .ToListAsync();
    }

    public async Task<List<Trabajo>> GetPendientesAsync() =>
        await _db.Trabajos
            .Include(t => t.Cliente)
            .Include(t => t.Profesional)
            .Include(t => t.Servicio)
            .Where(t => t.Estado == "pendiente")
            .OrderByDescending(t => t.CreadoEn)
            .ToListAsync();

    public async Task AddAsync(Trabajo trabajo)
    {
        _db.Trabajos.Add(trabajo);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Trabajo trabajo)
    {
        _db.Trabajos.Update(trabajo);
        await _db.SaveChangesAsync();
    }

    public async Task<int> CountAsync() =>
        await _db.Trabajos.CountAsync();

    public async Task<int> CountByEstadoAsync(string estado) =>
        await _db.Trabajos.CountAsync(t => t.Estado == estado);
}
