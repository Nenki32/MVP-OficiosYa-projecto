using Marketplace.Api.Core.Models;

namespace Marketplace.Api.Core.Interfaces;

public interface ICuentaCorrienteRepository
{
    Task<CuentaCorriente?> GetLastByProfesionalAsync(int profesionalId);
    Task<List<CuentaCorriente>> GetByProfesionalAsync(int profesionalId);
    Task AddAsync(CuentaCorriente entry);
    Task<decimal> GetSaldoAsync(int profesionalId);
}
