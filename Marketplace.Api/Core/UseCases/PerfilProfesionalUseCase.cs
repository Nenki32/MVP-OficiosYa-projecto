using NetTopologySuite.Geometries;
using Marketplace.Api.Core.Interfaces;
using Marketplace.Api.Core.Models;
using Marketplace.Api.Delivery.DTOs.Profesionales;

namespace Marketplace.Api.Core.UseCases;

public class PerfilProfesionalUseCase : IPerfilProfesionalService
{
    /// <summary>SRID 4326: coordenadas geograficas estandar (lat/lng, el de GPS).</summary>
    private const int Srid = 4326;

    private readonly IUsuarioRepository _usuarioRepo;

    public PerfilProfesionalUseCase(IUsuarioRepository usuarioRepo) =>
        _usuarioRepo = usuarioRepo;

    public async Task<PerfilProfesionalDto> ObtenerAsync(int profesionalId) =>
        MapToDto(await TraerProfesionalAsync(profesionalId));

    public async Task<PerfilProfesionalDto> ActualizarAsync(int profesionalId, ActualizarPerfilRequest request)
    {
        var usuario = await TraerProfesionalAsync(profesionalId);

        if (request.TipoPerfil == TiposPerfil.Empresa &&
            string.IsNullOrWhiteSpace(request.RazonSocial))
            throw new InvalidOperationException("Una empresa necesita razon social.");

        usuario.Nombre = request.Nombre.Trim();
        usuario.Telefono = Limpiar(request.Telefono);
        usuario.TipoPerfil = request.TipoPerfil;
        usuario.Descripcion = Limpiar(request.Descripcion);
        usuario.RadioCoberturaKm = request.RadioCoberturaKm;
        usuario.Disponible = request.Disponible;

        // Los datos de empresa se limpian al volver a persona: si quedaran,
        // el check constraint de la base rechazaria el guardado.
        var esEmpresa = request.TipoPerfil == TiposPerfil.Empresa;
        usuario.RazonSocial = esEmpresa ? Limpiar(request.RazonSocial) : null;
        usuario.Cuit = esEmpresa ? Limpiar(request.Cuit) : null;

        usuario.ActualizadoEn = DateTime.UtcNow;
        await _usuarioRepo.UpdateAsync(usuario);

        return MapToDto(usuario);
    }

    public async Task<PerfilProfesionalDto> ActualizarUbicacionAsync(
        int profesionalId, ActualizarUbicacionProfesionalRequest request)
    {
        var usuario = await TraerProfesionalAsync(profesionalId);

        // OJO con el orden: en un Point, X es la longitud e Y la latitud.
        // Invertirlos compila igual y ubica al profesional en otro continente.
        usuario.Ubicacion = new Point(request.Longitud, request.Latitud) { SRID = Srid };
        usuario.ActualizadoEn = DateTime.UtcNow;

        await _usuarioRepo.UpdateAsync(usuario);

        return MapToDto(usuario);
    }

    public async Task<PerfilProfesionalDto> ActualizarServiciosAsync(
        int profesionalId, ActualizarServiciosRequest request)
    {
        await TraerProfesionalAsync(profesionalId);

        // Se descartan los ids que no existen en el catalogo en vez de fallar:
        // un rubro dado de baja no deberia impedir guardar el resto.
        var existentes = await _usuarioRepo.FiltrarServiciosExistentesAsync(request.ServicioIds);

        if (existentes.Count == 0)
            throw new InvalidOperationException("Ninguno de los rubros indicados existe.");

        await _usuarioRepo.ReemplazarServiciosAsync(profesionalId, existentes);

        return MapToDto(await TraerProfesionalAsync(profesionalId));
    }

    private async Task<Usuario> TraerProfesionalAsync(int id)
    {
        var usuario = await _usuarioRepo.GetConServiciosAsync(id)
            ?? throw new KeyNotFoundException("Usuario no encontrado.");

        if (usuario.Rol != "profesional")
            throw new UnauthorizedAccessException("Solo los profesionales tienen perfil profesional.");

        return usuario;
    }

    private static string? Limpiar(string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

    /// <summary>
    /// Que le falta al perfil para poder recibir trabajos. Se calcula en el
    /// servidor para que la app y la web muestren exactamente lo mismo.
    /// </summary>
    private static List<string> CalcularFaltantes(Usuario u)
    {
        var faltantes = new List<string>();

        if (!u.Servicios.Any())
            faltantes.Add("Elegi al menos un rubro en el que trabajas.");

        if (u.Ubicacion is null)
            faltantes.Add("Definí tu zona de trabajo para ver trabajos cercanos.");

        if (u.RadioCoberturaKm is null)
            faltantes.Add("Indicá hasta cuántos kilómetros estás dispuesto a viajar.");

        if (u.TipoPerfil == TiposPerfil.Empresa && string.IsNullOrWhiteSpace(u.Cuit))
            faltantes.Add("Cargá el CUIT de la empresa.");

        return faltantes;
    }

    private static PerfilProfesionalDto MapToDto(Usuario u) => new()
    {
        Id = u.Id,
        Nombre = u.Nombre,
        Email = u.Email,
        Telefono = u.Telefono,
        TipoPerfil = u.TipoPerfil,
        RazonSocial = u.RazonSocial,
        Cuit = u.Cuit,
        NivelProfesional = u.NivelProfesional,
        NumeroMatricula = u.NumeroMatricula,
        Descripcion = u.Descripcion,
        Latitud = u.Ubicacion?.Y,
        Longitud = u.Ubicacion?.X,
        RadioCoberturaKm = u.RadioCoberturaKm,
        Disponible = u.Disponible,
        Servicios = u.Servicios
            .Where(ps => ps.Servicio is not null)
            .Select(ps => new ServicioDelProfesionalDto
            {
                Id = ps.ServicioId,
                Nombre = ps.Servicio!.Nombre,
            })
            .OrderBy(s => s.Nombre)
            .ToList(),
        Faltantes = CalcularFaltantes(u),
    };
}
