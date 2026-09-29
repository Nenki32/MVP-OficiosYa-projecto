using NetTopologySuite.Geometries;
using Marketplace.Api.Core.Interfaces;
using Marketplace.Api.Core.Models;
using Marketplace.Api.Delivery.DTOs.Trabajos;

namespace Marketplace.Api.Core.UseCases;

public class TrabajoUseCase : ITrabajoService
{
    private const decimal ComisionPorcentaje = 0.15m;

    private readonly ITrabajoRepository _trabajoRepo;
    private readonly IUsuarioRepository _usuarioRepo;
    private readonly ICuentaCorrienteRepository _ccRepo;
    private readonly IPostulacionRepository _postulacionRepo;
    private readonly IUnitOfWork _uow;

    public TrabajoUseCase(
        ITrabajoRepository trabajoRepo,
        IUsuarioRepository usuarioRepo,
        ICuentaCorrienteRepository ccRepo,
        IPostulacionRepository postulacionRepo,
        IUnitOfWork uow)
    {
        _trabajoRepo = trabajoRepo;
        _usuarioRepo = usuarioRepo;
        _ccRepo = ccRepo;
        _postulacionRepo = postulacionRepo;
        _uow = uow;
    }

    public async Task<TrabajoDetalleDto> CrearAsync(int clienteId, CrearTrabajoRequest request)
    {
        var trabajo = new Trabajo
        {
            ClienteId = clienteId,
            ServicioId = request.ServicioId,
            Estado = "pendiente",
            Descripcion = request.Descripcion,
            TipoPago = request.TipoPago,
            Ubicacion = CrearPunto(request.LatitudDestino, request.LongitudDestino),
            FechaVisita = request.FechaVisita?.ToUniversalTime(),
            DuracionEstimadaMin = request.FechaVisita is null ? null : 60,
            DireccionDestino = request.DireccionDestino
        };

        await _trabajoRepo.AddAsync(trabajo);
        return await ObtenerAsync(trabajo.Id);
    }

    public async Task<List<TrabajoDto>> ListarAsync(int usuarioId, string rol)
    {
        // El profesional recibe ademas la distancia a cada trabajo, y solo los
        // que caen dentro de su radio y sus rubros.
        if (rol == "profesional")
        {
            var conDistancia = await _trabajoRepo.GetParaProfesionalAsync(usuarioId);
            return conDistancia.Select(x =>
                {
                    var dto = OcultarDireccionSiAjeno(MapToLista(
                        x.Trabajo,
                        // Se redondea a un decimal: mostrar "1.6 km" es util,
                        // "1.6432871 km" es ruido.
                        x.DistanciaMetros is null ? null : Math.Round(x.DistanciaMetros.Value / 1000, 1)),
                        usuarioId);
                    dto.YaMePostule = x.YaMePostule;
                    return dto;
                })
                .ToList();
        }

        var trabajos = rol == "cliente"
            ? await _trabajoRepo.GetByClienteAsync(usuarioId)
            : await _trabajoRepo.GetPendientesAsync();

        return trabajos.Select(t => MapToLista(t, null)).ToList();
    }

    /// <summary>
    /// Hasta que el trabajo se le asigna, el profesional solo ve la zona: sin
    /// direccion y con coordenadas redondeadas a 2 decimales (~1 km).
    /// </summary>
    private static T OcultarDireccionSiAjeno<T>(T dto, int profesionalId) where T : TrabajoDto
    {
        if (dto.ProfesionalId == profesionalId) return dto;
        dto.DireccionDestino = null;
        dto.LatitudDestino = dto.LatitudDestino is null ? null : Math.Round(dto.LatitudDestino.Value, 2);
        dto.LongitudDestino = dto.LongitudDestino is null ? null : Math.Round(dto.LongitudDestino.Value, 2);
        return dto;
    }

    private static TrabajoDto MapToLista(Trabajo t, double? distanciaKm) => new()
    {
        Id = t.Id,
        ClienteId = t.ClienteId,
        ClienteNombre = t.Cliente?.Nombre ?? "",
        ProfesionalId = t.ProfesionalId,
        ProfesionalNombre = t.Profesional?.Nombre,
        ServicioId = t.ServicioId,
        ServicioNombre = t.Servicio?.Nombre ?? "",
        Estado = t.EstadoVisible(DateTime.UtcNow),
        TipoPago = t.TipoPago,
        LatitudDestino = t.Ubicacion?.Y,
        LongitudDestino = t.Ubicacion?.X,
        DireccionDestino = t.DireccionDestino,
        DistanciaKm = distanciaKm,
        FechaVisita = t.FechaVisita,
        MontoPagado = t.Pago?.MontoTotal,
        CreadoEn = t.CreadoEn
    };

    /// <summary>
    /// Arma el punto geografico. OJO con el orden: X es longitud e Y latitud.
    /// Invertirlos compila igual y ubica el trabajo en otro continente.
    /// </summary>
    private static Point? CrearPunto(double? latitud, double? longitud) =>
        latitud is null || longitud is null
            ? null
            : new Point(longitud.Value, latitud.Value) { SRID = 4326 };

    public async Task<TrabajoDetalleDto> ObtenerAsync(int id)
    {
        var trabajo = await _trabajoRepo.GetByIdWithAllAsync(id)
            ?? throw new KeyNotFoundException("Trabajo no encontrado.");

        return MapToDetalle(trabajo);
    }

    public async Task<TrabajoDetalleDto> ObtenerAsync(int id, int usuarioId, string rol)
    {
        var trabajo = await _trabajoRepo.GetByIdWithAllAsync(id)
            ?? throw new KeyNotFoundException("Trabajo no encontrado.");

        if (rol == "admin" || trabajo.ClienteId == usuarioId)
            return MapToDetalle(trabajo);

        if (rol != "profesional")
            throw new UnauthorizedAccessException("No puedes ver este trabajo.");

        // Elegible: el asignado, quien ya se postulo, o quien lo ve en su
        // listado (pendiente, de su rubro y dentro de su radio).
        var enListado = (await _trabajoRepo.GetParaProfesionalAsync(usuarioId, id)).FirstOrDefault();
        var elegible = trabajo.ProfesionalId == usuarioId
            || trabajo.Postulaciones.Any(p => p.ProfesionalId == usuarioId)
            || enListado is not null;
        if (!elegible)
            throw new UnauthorizedAccessException("No puedes ver este trabajo.");

        var dto = OcultarDireccionSiAjeno(MapToDetalle(trabajo), usuarioId);
        dto.DistanciaKm = enListado?.DistanciaMetros is null ? null : Math.Round(enListado.DistanciaMetros.Value / 1000, 1);
        // Los presupuestos de otros profesionales solo los ve el cliente.
        dto.Postulaciones = dto.Postulaciones.Where(p => p.ProfesionalId == usuarioId).ToList();
        if (trabajo.ProfesionalId != usuarioId)
            dto.Pago = null;
        return dto;
    }

    public async Task<TrabajoDetalleDto> ActualizarEstadoAsync(int id, int usuarioId, string nuevoEstado)
    {
        var trabajo = await _trabajoRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Trabajo no encontrado.");

        // "aceptado" solo se alcanza con POST /asignar (el cliente elige una postulacion)
        // y "completado" solo con POST /completar, que registra el pago.
        var transicionesValidas = new Dictionary<string, string[]>
        {
            { "pendiente", new[] { "cancelado" } },
            { "aceptado", new[] { "viajando", "cancelado" } },
            { "viajando", new[] { "en_progreso", "cancelado" } }
        };

        if (!transicionesValidas.TryGetValue(trabajo.Estado, out var permitidos) ||
            !permitidos.Contains(nuevoEstado))
            throw new InvalidOperationException(
                $"Transicion invalida: {trabajo.Estado} -> {nuevoEstado}");

        if (nuevoEstado == "cancelado" && trabajo.ProfesionalId != usuarioId && trabajo.ClienteId != usuarioId)
            throw new UnauthorizedAccessException("No puedes cancelar este trabajo.");

        // viajando / en_progreso: solo el profesional asignado.
        // Sin esto cualquiera movia el estado y recibia el detalle completo.
        if (nuevoEstado != "cancelado" && trabajo.ProfesionalId != usuarioId)
            throw new UnauthorizedAccessException("Solo el profesional asignado puede cambiar este estado.");

        trabajo.Estado = nuevoEstado;
        trabajo.ActualizadoEn = DateTime.UtcNow;
        await _trabajoRepo.UpdateAsync(trabajo);

        return await ObtenerAsync(id);
    }

    public async Task<TrabajoDetalleDto> ActualizarUbicacionAsync(int id, int usuarioId, ActualizarUbicacionRequest request)
    {
        var trabajo = await _trabajoRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Trabajo no encontrado.");

        if (trabajo.ProfesionalId != usuarioId)
            throw new UnauthorizedAccessException("Solo el profesional asignado puede actualizar ubicacion.");

        if (trabajo.Estado == "viajando")
        {
            trabajo.LatitudInicio = request.Latitud;
            trabajo.LongitudInicio = request.Longitud;
        }

        trabajo.ActualizadoEn = DateTime.UtcNow;
        await _trabajoRepo.UpdateAsync(trabajo);

        return await ObtenerAsync(id);
    }

    public async Task<TrabajoDetalleDto> CompletarAsync(int id, int usuarioId, CompletarTrabajoRequest request)
    {
        var trabajo = await _trabajoRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Trabajo no encontrado.");

        if (trabajo.ProfesionalId != usuarioId)
            throw new UnauthorizedAccessException("Solo el profesional asignado puede completar el trabajo.");

        if (trabajo.Estado != "en_progreso")
            throw new InvalidOperationException("El trabajo debe estar en_progreso para completarse.");

        var comision = request.MontoTotal * ComisionPorcentaje;

        // Todo lo que sigue escribe en CuentaCorriente, Usuarios, Trabajos y Pagos.
        // Va en una sola transaccion: sin esto, un fallo a mitad de camino dejaba
        // una comision adeudada sin el trabajo completado que la justifica.
        await _uow.ExecuteInTransactionAsync(async () =>
        {
            trabajo.Estado = "completado";
            trabajo.TipoPago = request.TipoPago;
            trabajo.ActualizadoEn = DateTime.UtcNow;

            if (request.TipoPago == "efectivo")
            {
                var saldoActual = await _ccRepo.GetSaldoAsync(usuarioId);
                var nuevoSaldo = saldoActual - comision;

                await _ccRepo.AddAsync(new CuentaCorriente
                {
                    ProfesionalId = usuarioId,
                    TrabajoId = trabajo.Id,
                    Tipo = "comision_adeudada",
                    Monto = -comision,
                    SaldoPosterior = nuevoSaldo,
                    Referencia = $"Comision {ComisionPorcentaje:P0} - Trabajo #{trabajo.Id}"
                });

                if (nuevoSaldo < 0)
                {
                    var profesional = await _usuarioRepo.GetByIdAsync(usuarioId);
                    if (profesional != null && profesional.Estado != (int)EstadoUsuario.Deudor)
                    {
                        profesional.Estado = (int)EstadoUsuario.Deudor;
                        profesional.ActualizadoEn = DateTime.UtcNow;
                        await _usuarioRepo.UpdateAsync(profesional);
                    }
                }
            }

            trabajo.Pago = new Pago
            {
                TrabajoId = trabajo.Id,
                MontoTotal = request.MontoTotal,
                Comision = comision,
                TipoPago = request.TipoPago,
                Estado = "registrado"
            };

            await _trabajoRepo.UpdateAsync(trabajo);
        });

        return await ObtenerAsync(id);
    }

    public async Task AsignarProfesionalAsync(int trabajoId, int profesionalId)
    {
        var trabajo = await _trabajoRepo.GetByIdAsync(trabajoId)
            ?? throw new KeyNotFoundException("Trabajo no encontrado.");

        trabajo.ProfesionalId = profesionalId;
        trabajo.Estado = "aceptado";
        trabajo.ActualizadoEn = DateTime.UtcNow;
        await _trabajoRepo.UpdateAsync(trabajo);
    }

    private static TrabajoDetalleDto MapToDetalle(Trabajo t) => new()
    {
        Id = t.Id,
        ClienteId = t.ClienteId,
        ClienteNombre = t.Cliente?.Nombre ?? "",
        ProfesionalId = t.ProfesionalId,
        ProfesionalNombre = t.Profesional?.Nombre,
        ServicioId = t.ServicioId,
        ServicioNombre = t.Servicio?.Nombre ?? "",
        Estado = t.EstadoVisible(DateTime.UtcNow),
        Descripcion = t.Descripcion,
        TipoPago = t.TipoPago,
        LatitudDestino = t.Ubicacion?.Y,
        LongitudDestino = t.Ubicacion?.X,
        DireccionDestino = t.DireccionDestino,
        LatitudInicio = t.LatitudInicio,
        LongitudInicio = t.LongitudInicio,
        Pago = t.Pago != null ? new PagoInfo
        {
            MontoTotal = t.Pago.MontoTotal,
            Comision = t.Pago.Comision,
            TipoPago = t.Pago.TipoPago,
            Estado = t.Pago.Estado
        } : null,
        Resenia = t.Resenia != null ? new ReseniaInfo
        {
            Puntuacion = t.Resenia.Puntuacion,
            Comentario = t.Resenia.Comentario,
            ClienteNombre = t.Resenia.Cliente?.Nombre
        } : null,
        Postulaciones = t.Postulaciones.Select(p => new PostulacionDto
        {
            Id = p.Id,
            ProfesionalId = p.ProfesionalId,
            ProfesionalNombre = p.Profesional?.Nombre ?? "",
            NivelProfesional = p.Profesional?.NivelProfesional,
            Presupuesto = p.Presupuesto,
            CreadoEn = p.CreadoEn
        }).ToList(),
        CreadoEn = t.CreadoEn,
        ActualizadoEn = t.ActualizadoEn
    };
}
