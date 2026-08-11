using Marketplace.Api.Delivery.DTOs.Profesionales;

namespace Marketplace.Api.Core.Interfaces;

public interface IPerfilProfesionalService
{
    Task<PerfilProfesionalDto> ObtenerAsync(int profesionalId);
    Task<PerfilProfesionalDto> ActualizarAsync(int profesionalId, ActualizarPerfilRequest request);
    Task<PerfilProfesionalDto> ActualizarUbicacionAsync(int profesionalId, ActualizarUbicacionProfesionalRequest request);
    Task<PerfilProfesionalDto> ActualizarServiciosAsync(int profesionalId, ActualizarServiciosRequest request);
}
