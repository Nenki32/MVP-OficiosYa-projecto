using Marketplace.Api.Core.Interfaces;
using Marketplace.Api.Core.Models;
using Marketplace.Api.Delivery.DTOs.CuentaCorriente;

namespace Marketplace.Api.Core.UseCases;

public class CuentaCorrienteUseCase : ICuentaCorrienteService
{
    private readonly ICuentaCorrienteRepository _ccRepo;
    private readonly IUsuarioRepository _usuarioRepo;

    public CuentaCorrienteUseCase(ICuentaCorrienteRepository ccRepo, IUsuarioRepository usuarioRepo)
    {
        _ccRepo = ccRepo;
        _usuarioRepo = usuarioRepo;
    }

    public async Task<SaldoResponse> ObtenerSaldoAsync(int profesionalId)
    {
        var saldo = await _ccRepo.GetSaldoAsync(profesionalId);
        return new SaldoResponse { SaldoActual = saldo };
    }

    public async Task<List<CuentaCorrienteResponse>> ObtenerMovimientosAsync(int profesionalId)
    {
        var movimientos = await _ccRepo.GetByProfesionalAsync(profesionalId);

        return movimientos.Select(cc => new CuentaCorrienteResponse
        {
            Id = cc.Id,
            Tipo = cc.Tipo,
            Monto = cc.Monto,
            SaldoPosterior = cc.SaldoPosterior,
            Referencia = cc.Referencia,
            TrabajoId = cc.TrabajoId,
            CreadoEn = cc.CreadoEn
        }).ToList();
    }

    public async Task<CuentaCorrienteResponse> PagarDeudaAsync(int profesionalId, decimal monto)
    {
        if (monto <= 0)
            throw new InvalidOperationException("El monto debe ser positivo.");

        var saldoActual = await _ccRepo.GetSaldoAsync(profesionalId);

        if (saldoActual >= 0)
            throw new InvalidOperationException("No tenes deuda pendiente.");

        if (monto > Math.Abs(saldoActual))
            throw new InvalidOperationException("El pago excede la deuda actual.");

        var nuevoSaldo = saldoActual + monto;

        var entry = new CuentaCorriente
        {
            ProfesionalId = profesionalId,
            Tipo = "pago_deuda",
            Monto = monto,
            SaldoPosterior = nuevoSaldo,
            Referencia = $"Pago de deuda - $ {monto:N2}"
        };

        if (nuevoSaldo >= 0)
        {
            var profesional = await _usuarioRepo.GetByIdAsync(profesionalId);
            if (profesional != null)
            {
                profesional.Estado = (int)EstadoUsuario.Activo;
                profesional.ActualizadoEn = DateTime.UtcNow;
                await _usuarioRepo.UpdateAsync(profesional);
            }
        }

        await _ccRepo.AddAsync(entry);

        return new CuentaCorrienteResponse
        {
            Id = entry.Id,
            Tipo = entry.Tipo,
            Monto = entry.Monto,
            SaldoPosterior = entry.SaldoPosterior,
            Referencia = entry.Referencia,
            CreadoEn = entry.CreadoEn
        };
    }
}
