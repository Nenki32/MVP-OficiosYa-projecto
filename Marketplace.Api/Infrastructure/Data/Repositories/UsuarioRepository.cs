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
}
