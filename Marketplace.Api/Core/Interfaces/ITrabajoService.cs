using Marketplace.Api.Delivery.DTOs.Trabajos;

namespace Marketplace.Api.Core.Interfaces;

public interface ITrabajoService
{
    Task<TrabajoDetalleDto> CrearAsync(int clienteId, CrearTrabajoRequest request);
    Task<List<TrabajoDto>> ListarAsync(int usuarioId, string rol);
    Task<TrabajoDetalleDto> ObtenerAsync(int id);
    Task<TrabajoDetalleDto> ActualizarEstadoAsync(int id, int usuarioId, string nuevoEstado);
    Task<TrabajoDetalleDto> ActualizarUbicacionAsync(int id, int usuarioId, ActualizarUbicacionRequest request);
    Task<TrabajoDetalleDto> CompletarAsync(int id, int usuarioId, CompletarTrabajoRequest request);
    Task AsignarProfesionalAsync(int trabajoId, int profesionalId);
}
