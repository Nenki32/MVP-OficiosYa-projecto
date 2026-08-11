using Marketplace.Api.Core.Models;

namespace Marketplace.Api.Core.Interfaces;

public interface ITrabajoRepository
{
    Task<Trabajo?> GetByIdAsync(int id);
    Task<Trabajo?> GetByIdWithAllAsync(int id);
    Task<List<Trabajo>> GetByClienteAsync(int clienteId);
    Task<List<Trabajo>> GetByProfesionalAsync(int profesionalId);
    Task<List<Trabajo>> GetPendientesAsync();

    /// <summary>
    /// Trabajos relevantes para un profesional: los suyos, mas los disponibles
    /// que caen dentro de su radio y sus rubros.
    ///
    /// El filtrado y el calculo de distancia los hace la base con PostGIS. Si
    /// el profesional no cargo ubicacion o radio, no se filtra por cercania y
    /// la distancia viene nula: es preferible mostrar todo antes que una lista
    /// vacia sin explicacion.
    /// </summary>
    Task<List<TrabajoConDistancia>> GetParaProfesionalAsync(int profesionalId);
    Task AddAsync(Trabajo trabajo);
    Task UpdateAsync(Trabajo trabajo);
    Task<int> CountAsync();
    Task<int> CountByEstadoAsync(string estado);
}
