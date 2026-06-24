using Marketplace.Api.DTOs.Trabajos;

namespace Marketplace.Api.Services;

public interface ITrabajoService
{
    Task<TrabajoResponse> CrearAsync(int clienteId, CrearTrabajoRequest request);
    Task<List<TrabajoResponse>> ListarAsync(int usuarioId, string rol);
    Task<TrabajoResponse> ObtenerAsync(int id);
    Task<TrabajoResponse> ActualizarEstadoAsync(int id, int usuarioId, string nuevoEstado);
    Task<TrabajoResponse> ActualizarUbicacionAsync(int id, int usuarioId, ActualizarUbicacionRequest request);
    Task<TrabajoResponse> CompletarAsync(int id, int usuarioId, CompletarTrabajoRequest request);
    Task AsignarProfesionalAsync(int trabajoId, int profesionalId);
}
