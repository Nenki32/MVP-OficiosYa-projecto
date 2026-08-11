using Microsoft.EntityFrameworkCore;
using Marketplace.Api.Core.Interfaces;
using Marketplace.Api.Core.Models;

namespace Marketplace.Api.Infrastructure.Data.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly AppDbContext _db;

    public UsuarioRepository(AppDbContext db) => _db = db;

    public async Task<Usuario?> GetByIdAsync(int id) =>
        await _db.Usuarios.FindAsync(id);

    public async Task<Usuario?> GetByEmailAsync(string email) =>
        await _db.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<bool> ExistsByEmailAsync(string email) =>
        await _db.Usuarios.AnyAsync(u => u.Email == email);

    public async Task AddAsync(Usuario usuario)
    {
        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Usuario usuario)
    {
        _db.Usuarios.Update(usuario);
        await _db.SaveChangesAsync();
    }

    public async Task<List<Usuario>> GetAllAsync() =>
        await _db.Usuarios.OrderBy(u => u.CreadoEn).ToListAsync();

    public async Task<Usuario?> GetConServiciosAsync(int id) =>
        await _db.Usuarios
            .Include(u => u.Servicios)
                .ThenInclude(ps => ps.Servicio)
            .FirstOrDefaultAsync(u => u.Id == id);

    public async Task ReemplazarServiciosAsync(int profesionalId, IEnumerable<int> servicioIds)
    {
        var deseados = servicioIds.Distinct().ToHashSet();

        var actuales = await _db.ProfesionalServicios
            .Where(ps => ps.ProfesionalId == profesionalId)
            .ToListAsync();

        // Solo se tocan las diferencias: sin esto, borrar todo y volver a
        // insertar generaria escrituras innecesarias en cada guardado.
        var aQuitar = actuales.Where(ps => !deseados.Contains(ps.ServicioId)).ToList();
        var yaEstan = actuales.Select(ps => ps.ServicioId).ToHashSet();
        var aAgregar = deseados.Except(yaEstan);

        _db.ProfesionalServicios.RemoveRange(aQuitar);
        _db.ProfesionalServicios.AddRange(aAgregar.Select(id => new ProfesionalServicio
        {
            ProfesionalId = profesionalId,
            ServicioId = id,
        }));

        await _db.SaveChangesAsync();
    }

    public async Task<List<int>> FiltrarServiciosExistentesAsync(IEnumerable<int> servicioIds)
    {
        var ids = servicioIds.Distinct().ToList();
        return await _db.Servicios
            .Where(s => ids.Contains(s.Id))
            .Select(s => s.Id)
            .ToListAsync();
    }
}
