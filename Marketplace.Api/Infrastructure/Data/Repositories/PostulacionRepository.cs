using Microsoft.EntityFrameworkCore;
using Marketplace.Api.Core.Interfaces;
using Marketplace.Api.Core.Models;

namespace Marketplace.Api.Infrastructure.Data.Repositories;

public class PostulacionRepository : IPostulacionRepository
{
    private readonly AppDbContext _db;

    public PostulacionRepository(AppDbContext db) => _db = db;

    public async Task<bool> ExistsAsync(int trabajoId, int profesionalId) =>
        await _db.Postulaciones
            .AnyAsync(p => p.TrabajoId == trabajoId && p.ProfesionalId == profesionalId);

    public async Task AddAsync(Postulacion postulacion)
    {
        _db.Postulaciones.Add(postulacion);
        await _db.SaveChangesAsync();
    }

    public async Task<List<Postulacion>> GetByTrabajoAsync(int trabajoId) =>
        await _db.Postulaciones
            .Include(p => p.Profesional)
            .Where(p => p.TrabajoId == trabajoId)
            .ToListAsync();
}
