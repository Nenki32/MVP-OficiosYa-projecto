using Marketplace.Api.Core.Models;

namespace Marketplace.Api.Core.Interfaces;

public interface ITrabajoRepository
{
    Task<Trabajo?> GetByIdAsync(int id);
    Task<Trabajo?> GetByIdWithAllAsync(int id);
    Task<List<Trabajo>> GetByClienteAsync(int clienteId);
    Task<List<Trabajo>> GetByProfesionalAsync(int profesionalId);
    Task<List<Trabajo>> GetPendientesAsync();
    Task AddAsync(Trabajo trabajo);
    Task UpdateAsync(Trabajo trabajo);
    Task<int> CountAsync();
    Task<int> CountByEstadoAsync(string estado);
}
