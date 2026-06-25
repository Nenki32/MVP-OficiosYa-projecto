using Microsoft.EntityFrameworkCore;
using Marketplace.Api.Core.Interfaces;
using Marketplace.Api.Core.Models;

namespace Marketplace.Api.Infrastructure.Data.Repositories;

public class CuentaCorrienteRepository : ICuentaCorrienteRepository
{
    private readonly AppDbContext _db;

    public CuentaCorrienteRepository(AppDbContext db) => _db = db;

    public async Task<CuentaCorriente?> GetLastByProfesionalAsync(int profesionalId) =>
        await _db.CuentaCorriente
            .Where(cc => cc.ProfesionalId == profesionalId)
            .OrderByDescending(cc => cc.CreadoEn)
            .FirstOrDefaultAsync();

    public async Task<List<CuentaCorriente>> GetByProfesionalAsync(int profesionalId) =>
        await _db.CuentaCorriente
            .Where(cc => cc.ProfesionalId == profesionalId)
            .OrderByDescending(cc => cc.CreadoEn)
            .ToListAsync();

    public async Task AddAsync(CuentaCorriente entry)
    {
        _db.CuentaCorriente.Add(entry);
        await _db.SaveChangesAsync();
    }

    public async Task<decimal> GetSaldoAsync(int profesionalId)
    {
        var ultimo = await _db.CuentaCorriente
            .Where(cc => cc.ProfesionalId == profesionalId)
            .OrderByDescending(cc => cc.CreadoEn)
            .Select(cc => (decimal?)cc.SaldoPosterior)
            .FirstOrDefaultAsync();

        return ultimo ?? 0;
    }
}
