using Marketplace.Api.Core.Models;

namespace Marketplace.Api.Core.Interfaces;

public interface IPostulacionRepository
{
    Task<bool> ExistsAsync(int trabajoId, int profesionalId);
    Task AddAsync(Postulacion postulacion);
    Task<List<Postulacion>> GetByTrabajoAsync(int trabajoId);
}
